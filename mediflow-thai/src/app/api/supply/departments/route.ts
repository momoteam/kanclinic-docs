import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const departments = await prisma.department.findMany({
    include: {
      headUser: { select: { firstName: true, lastName: true } },
      _count: { select: { requisitions: true } },
    },
    orderBy: { nameTh: "asc" },
  });
  return NextResponse.json(departments);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const clinic = await prisma.clinic.findFirst();
  if (!clinic) return NextResponse.json({ error: "ไม่พบข้อมูลคลินิก" }, { status: 400 });

  const department = await prisma.department.create({
    data: {
      clinicId: clinic.id,
      code: body.code || "",
      nameTh: body.nameTh,
      nameEn: body.nameEn || "",
      headUserId: body.headUserId || null,
    },
  });
  return NextResponse.json(department, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, createdAt, updatedAt, clinicId, headUser, _count, requisitions, ...data } = body;
  if (!id) return NextResponse.json({ error: "ต้องระบุ ID" }, { status: 400 });

  const department = await prisma.department.update({ where: { id }, data });
  return NextResponse.json(department);
}
