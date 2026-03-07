import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateReceiveNumber } from "@/lib/utils";

export async function GET() {
  const receives = await prisma.supplyReceive.findMany({
    include: {
      supplier: { select: { nameTh: true } },
      receivedBy: { select: { firstName: true, lastName: true } },
      items: { include: { receive: false } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json(receives);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const clinic = await prisma.clinic.findFirst();
  if (!clinic) return NextResponse.json({ error: "ไม่พบข้อมูลคลินิก" }, { status: 400 });

  const user = await prisma.user.findFirst({ where: { clinicId: clinic.id, isActive: true } });
  if (!user) return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 400 });

  const receiveNumber = generateReceiveNumber();
  const items: { supplyItemId: string; quantity: number; unitCost: number; lotNumber: string; expiryDate?: string }[] = body.items || [];

  const totalAmount = items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0);

  const result = await prisma.$transaction(async (tx) => {
    const receive = await tx.supplyReceive.create({
      data: {
        clinicId: clinic.id,
        receiveNumber,
        supplierId: body.supplierId || null,
        receiveDate: body.receiveDate ? new Date(body.receiveDate) : new Date(),
        invoiceNumber: body.invoiceNumber || "",
        totalAmount,
        notes: body.notes || "",
        receivedById: body.receivedById || user.id,
        status: "Completed",
        items: {
          create: items.map((i) => ({
            supplyItemId: i.supplyItemId,
            quantity: i.quantity,
            unitCost: i.unitCost,
            totalCost: i.quantity * i.unitCost,
            lotNumber: i.lotNumber || "",
            expiryDate: i.expiryDate ? new Date(i.expiryDate) : null,
          })),
        },
      },
    });

    for (const item of items) {
      const stock = await tx.supplyStock.create({
        data: {
          clinicId: clinic.id,
          supplyItemId: item.supplyItemId,
          lotNumber: item.lotNumber || "",
          quantity: item.quantity,
          unitCost: item.unitCost,
          receivedDate: body.receiveDate ? new Date(body.receiveDate) : new Date(),
          expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
        },
      });

      await tx.supplyMovement.create({
        data: {
          supplyStockId: stock.id,
          supplyItemId: item.supplyItemId,
          movementType: "Receive",
          quantity: item.quantity,
          referenceId: receive.id,
          referenceType: "Receive",
          notes: `รับเข้า ${receiveNumber}`,
          performedById: body.receivedById || user.id,
        },
      });
    }

    return receive;
  });

  return NextResponse.json(result, { status: 201 });
}
