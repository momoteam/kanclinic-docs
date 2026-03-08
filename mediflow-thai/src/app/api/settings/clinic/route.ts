import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    let clinic = await prisma.clinic.findFirst();

    if (!clinic) {
      clinic = await prisma.clinic.create({
        data: {
          nameTh: "คลินิกของฉัน",
          nameEn: "My Clinic",
          clinicType: "general",
        },
      });
    }

    return NextResponse.json(clinic);
  } catch (error) {
    console.error("GET /api/settings/clinic error:", error);
    return NextResponse.json(
      { error: "ไม่สามารถดึงข้อมูลคลินิกได้" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, createdAt, updatedAt, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ต้องระบุ id ของคลินิก" },
        { status: 400 }
      );
    }

    const clinic = await prisma.clinic.update({
      where: { id },
      data,
    });

    return NextResponse.json(clinic);
  } catch (error) {
    console.error("PUT /api/settings/clinic error:", error);
    return NextResponse.json(
      { error: "ไม่สามารถบันทึกข้อมูลคลินิกได้" },
      { status: 500 }
    );
  }
}
