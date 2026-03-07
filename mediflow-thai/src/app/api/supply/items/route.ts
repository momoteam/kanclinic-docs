import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const categoryId = searchParams.get("categoryId");

  const items = await prisma.supplyItem.findMany({
    where: {
      ...(q ? {
        OR: [
          { nameTh: { contains: q } },
          { code: { contains: q } },
        ],
      } : {}),
      ...(categoryId ? { categoryId } : {}),
    },
    include: {
      category: { select: { nameTh: true, code: true } },
      stocks: { select: { quantity: true } },
    },
    orderBy: { code: "asc" },
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const clinic = await prisma.clinic.findFirst();
  if (!clinic) return NextResponse.json({ error: "ไม่พบข้อมูลคลินิก" }, { status: 400 });

  const item = await prisma.supplyItem.create({
    data: {
      clinicId: clinic.id,
      categoryId: body.categoryId,
      code: body.code || "",
      nameTh: body.nameTh,
      nameEn: body.nameEn || "",
      unit: body.unit || "",
      minStock: parseInt(body.minStock) || 0,
      maxStock: parseInt(body.maxStock) || 0,
      price: parseFloat(body.price) || 0,
      description: body.description || "",
    },
  });
  return NextResponse.json(item, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, createdAt, updatedAt, clinicId, category, stocks, ...data } = body;
  if (!id) return NextResponse.json({ error: "ต้องระบุ ID" }, { status: 400 });

  if (data.minStock !== undefined) data.minStock = parseInt(data.minStock) || 0;
  if (data.maxStock !== undefined) data.maxStock = parseInt(data.maxStock) || 0;
  if (data.price !== undefined) data.price = parseFloat(data.price) || 0;

  const item = await prisma.supplyItem.update({ where: { id }, data });
  return NextResponse.json(item);
}
