import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const suppliers = await prisma.supplier.findMany({
    orderBy: { nameTh: "asc" },
  });
  return NextResponse.json(suppliers);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const clinic = await prisma.clinic.findFirst();
  if (!clinic) return NextResponse.json({ error: "ไม่พบข้อมูลคลินิก" }, { status: 400 });

  const supplier = await prisma.supplier.create({
    data: {
      clinicId: clinic.id,
      code: body.code || "",
      nameTh: body.nameTh,
      nameEn: body.nameEn || "",
      contactPerson: body.contactPerson || "",
      phone: body.phone || "",
      email: body.email || "",
      address: body.address || "",
      taxId: body.taxId || "",
    },
  });
  return NextResponse.json(supplier, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, createdAt, updatedAt, clinicId, supplyReceives, ...data } = body;
  if (!id) return NextResponse.json({ error: "ต้องระบุ ID" }, { status: 400 });

  const supplier = await prisma.supplier.update({ where: { id }, data });
  return NextResponse.json(supplier);
}
