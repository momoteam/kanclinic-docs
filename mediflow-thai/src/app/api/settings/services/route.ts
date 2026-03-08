import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const services = await prisma.service.findMany({
      orderBy: [{ category: "asc" }, { nameTh: "asc" }],
    });

    return NextResponse.json(services);
  } catch (error) {
    console.error("GET /api/settings/services error:", error);
    return NextResponse.json(
      { error: "ไม่สามารถดึงข้อมูลบริการได้" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const clinic = await prisma.clinic.findFirst();
    if (!clinic) {
      return NextResponse.json(
        { error: "ไม่พบข้อมูลคลินิก" },
        { status: 400 }
      );
    }

    const service = await prisma.service.create({
      data: {
        clinicId: clinic.id,
        code: body.code || "",
        nameTh: body.nameTh,
        nameEn: body.nameEn || "",
        category: body.category || "General",
        price: parseFloat(body.price) || 0,
        durationMinutes: parseInt(body.durationMinutes) || 15,
        description: body.description || "",
        isActive: body.isActive !== undefined ? body.isActive : true,
      },
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error("POST /api/settings/services error:", error);
    return NextResponse.json(
      { error: "ไม่สามารถสร้างบริการได้" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, createdAt, updatedAt, clinicId, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ต้องระบุ id ของบริการ" },
        { status: 400 }
      );
    }

    // Ensure numeric types
    if (data.price !== undefined) data.price = parseFloat(data.price) || 0;
    if (data.durationMinutes !== undefined)
      data.durationMinutes = parseInt(data.durationMinutes) || 15;

    const service = await prisma.service.update({
      where: { id },
      data,
    });

    return NextResponse.json(service);
  } catch (error) {
    console.error("PUT /api/settings/services error:", error);
    return NextResponse.json(
      { error: "ไม่สามารถอัปเดตบริการได้" },
      { status: 500 }
    );
  }
}
