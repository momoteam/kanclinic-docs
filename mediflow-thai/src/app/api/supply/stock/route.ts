import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const items = await prisma.supplyItem.findMany({
    where: { isActive: true },
    include: {
      category: { select: { nameTh: true, code: true } },
      stocks: {
        where: { quantity: { gt: 0 } },
        select: { id: true, lotNumber: true, quantity: true, unitCost: true, receivedDate: true, expiryDate: true, location: true },
        orderBy: { receivedDate: "asc" },
      },
    },
    orderBy: { code: "asc" },
  });

  const result = items.map((item) => ({
    ...item,
    totalStock: item.stocks.reduce((sum, s) => sum + s.quantity, 0),
    totalValue: item.stocks.reduce((sum, s) => sum + s.quantity * s.unitCost, 0),
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  if (action === "adjust") {
    const user = await prisma.user.findFirst({ where: { isActive: true } });
    if (!user) return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 400 });

    const stock = await prisma.supplyStock.findUnique({ where: { id: body.stockId } });
    if (!stock) return NextResponse.json({ error: "ไม่พบสต็อก" }, { status: 404 });

    const newQty = parseInt(body.newQuantity);
    const diff = newQty - stock.quantity;
    const movementType = diff >= 0 ? "AdjustIncrease" : "AdjustDecrease";

    await prisma.$transaction([
      prisma.supplyStock.update({
        where: { id: body.stockId },
        data: { quantity: newQty },
      }),
      prisma.supplyMovement.create({
        data: {
          supplyStockId: body.stockId,
          supplyItemId: stock.supplyItemId,
          movementType,
          quantity: diff,
          referenceType: "Adjustment",
          notes: body.reason || "",
          performedById: body.performedById || user.id,
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  }

  if (action === "writeoff") {
    const clinic = await prisma.clinic.findFirst();
    const user = await prisma.user.findFirst({ where: { isActive: true } });
    if (!clinic || !user) return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 400 });

    const items: { supplyItemId: string; stockId: string; quantity: number; unitCost: number; condition: string; notes: string }[] = body.items || [];

    await prisma.$transaction(async (tx) => {
      const writeOff = await tx.supplyWriteOff.create({
        data: {
          clinicId: clinic.id,
          writeOffNumber: body.writeOffNumber || "",
          reason: body.reason || "",
          status: "Completed",
          requestedById: body.requestedById || user.id,
          approvedById: body.requestedById || user.id,
          approvedAt: new Date(),
          notes: body.notes || "",
          items: {
            create: items.map((i) => ({
              supplyItemId: i.supplyItemId,
              quantity: i.quantity,
              unitCost: i.unitCost,
              totalCost: i.quantity * i.unitCost,
              condition: i.condition || "",
              notes: i.notes || "",
            })),
          },
        },
      });

      for (const item of items) {
        await tx.supplyStock.update({
          where: { id: item.stockId },
          data: { quantity: { decrement: item.quantity } },
        });
        await tx.supplyMovement.create({
          data: {
            supplyStockId: item.stockId,
            supplyItemId: item.supplyItemId,
            movementType: "WriteOff",
            quantity: -item.quantity,
            referenceId: writeOff.id,
            referenceType: "WriteOff",
            notes: `ตัดจำหน่าย: ${item.condition}`,
            performedById: body.requestedById || user.id,
          },
        });
      }
    });

    return NextResponse.json({ success: true }, { status: 201 });
  }

  return NextResponse.json({ error: "ไม่รู้จัก action" }, { status: 400 });
}
