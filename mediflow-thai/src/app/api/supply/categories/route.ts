import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const categories = await prisma.supplyCategory.findMany({
    orderBy: { nameTh: "asc" },
    include: { _count: { select: { items: true } } },
  });
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const clinic = await prisma.clinic.findFirst();
  if (!clinic) return NextResponse.json({ error: "ไม่พบข้อมูลคลินิก" }, { status: 400 });

  const category = await prisma.supplyCategory.create({
    data: {
      clinicId: clinic.id,
      code: body.code || "",
      nameTh: body.nameTh,
      nameEn: body.nameEn || "",
      description: body.description || "",
    },
  });
  return NextResponse.json(category, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, createdAt, updatedAt, clinicId, _count, ...data } = body;
  if (!id) return NextResponse.json({ error: "ต้องระบุ ID" }, { status: 400 });

  const category = await prisma.supplyCategory.update({ where: { id }, data });
  return NextResponse.json(category);
}
