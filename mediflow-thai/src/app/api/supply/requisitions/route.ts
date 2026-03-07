import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateRequisitionNumber } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const requisitions = await prisma.supplyRequisition.findMany({
    where: status ? { status } : undefined,
    include: {
      department: { select: { nameTh: true } },
      requestedBy: { select: { firstName: true, lastName: true } },
      approvedBy: { select: { firstName: true, lastName: true } },
      items: { include: { supplyItem: { select: { code: true, nameTh: true, unit: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json(requisitions);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const clinic = await prisma.clinic.findFirst();
  if (!clinic) return NextResponse.json({ error: "ไม่พบข้อมูลคลินิก" }, { status: 400 });

  const user = await prisma.user.findFirst({ where: { clinicId: clinic.id, isActive: true } });
  if (!user) return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 400 });

  const requisition = await prisma.supplyRequisition.create({
    data: {
      clinicId: clinic.id,
      requisitionNumber: generateRequisitionNumber(),
      departmentId: body.departmentId,
      requestedById: body.requestedById || user.id,
      purpose: body.purpose || "",
      notes: body.notes || "",
      items: {
        create: (body.items || []).map((i: { supplyItemId: string; requestedQty: number; notes?: string }) => ({
          supplyItemId: i.supplyItemId,
          requestedQty: i.requestedQty,
          notes: i.notes || "",
        })),
      },
    },
  });
  return NextResponse.json(requisition, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, action } = body;
  if (!id) return NextResponse.json({ error: "ต้องระบุ ID" }, { status: 400 });

  const user = await prisma.user.findFirst({ where: { isActive: true } });
  if (!user) return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 400 });

  if (action === "approve") {
    const items: { id: string; approvedQty: number }[] = body.items || [];
    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        await tx.supplyRequisitionItem.update({
          where: { id: item.id },
          data: { approvedQty: item.approvedQty },
        });
      }
      await tx.supplyRequisition.update({
        where: { id },
        data: {
          status: "Approved",
          approvedById: body.approvedById || user.id,
          approvedAt: new Date(),
          approverNotes: body.approverNotes || "",
        },
      });
    });
  } else if (action === "reject") {
    await prisma.supplyRequisition.update({
      where: { id },
      data: {
        status: "Rejected",
        approvedById: body.approvedById || user.id,
        approvedAt: new Date(),
        approverNotes: body.approverNotes || "",
      },
    });
  } else if (action === "disburse") {
    const clinic = await prisma.clinic.findFirst();
    if (!clinic) return NextResponse.json({ error: "ไม่พบข้อมูลคลินิก" }, { status: 400 });

    const requisition = await prisma.supplyRequisition.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!requisition) return NextResponse.json({ error: "ไม่พบใบเบิก" }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      for (const item of requisition.items) {
        const qty = item.approvedQty ?? item.requestedQty;
        if (qty <= 0) continue;

        const stocks = await tx.supplyStock.findMany({
          where: { supplyItemId: item.supplyItemId, quantity: { gt: 0 } },
          orderBy: { receivedDate: "asc" },
        });

        let remaining = qty;
        for (const stock of stocks) {
          if (remaining <= 0) break;
          const deduct = Math.min(stock.quantity, remaining);
          await tx.supplyStock.update({
            where: { id: stock.id },
            data: { quantity: stock.quantity - deduct },
          });
          await tx.supplyMovement.create({
            data: {
              supplyStockId: stock.id,
              supplyItemId: item.supplyItemId,
              movementType: "Disburse",
              quantity: -deduct,
              referenceId: requisition.id,
              referenceType: "Requisition",
              notes: `เบิกจ่าย ${requisition.requisitionNumber}`,
              performedById: body.disbursedById || user.id,
            },
          });
          remaining -= deduct;
        }

        await tx.supplyRequisitionItem.update({
          where: { id: item.id },
          data: { disbursedQty: qty - remaining },
        });
      }

      await tx.supplyRequisition.update({
        where: { id },
        data: {
          status: "Disbursed",
          disbursedById: body.disbursedById || user.id,
          disbursedAt: new Date(),
        },
      });
    });
  }

  const updated = await prisma.supplyRequisition.findUnique({
    where: { id },
    include: { items: { include: { supplyItem: true } } },
  });
  return NextResponse.json(updated);
}
