import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const plans = await prisma.insurancePlan.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json(plans);
  } catch (error) {
    console.error("GET /api/settings/insurance error:", error);
    return NextResponse.json(
      { error: "ไม่สามารถดึงข้อมูลสิทธิการรักษาได้" },
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

    const plan = await prisma.insurancePlan.create({
      data: {
        clinicId: clinic.id,
        name: body.name,
        type: body.type || "SelfPay",
        discountPercent: parseFloat(body.discountPercent) || 0,
        coverageLimit: parseFloat(body.coverageLimit) || 0,
        description: body.description || "",
        isActive: body.isActive !== undefined ? body.isActive : true,
      },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error("POST /api/settings/insurance error:", error);
    return NextResponse.json(
      { error: "ไม่สามารถสร้างสิทธิการรักษาได้" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, createdAt, clinicId, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ต้องระบุ id ของสิทธิการรักษา" },
        { status: 400 }
      );
    }

    // Ensure numeric types
    if (data.discountPercent !== undefined)
      data.discountPercent = parseFloat(data.discountPercent) || 0;
    if (data.coverageLimit !== undefined)
      data.coverageLimit = parseFloat(data.coverageLimit) || 0;

    const plan = await prisma.insurancePlan.update({
      where: { id },
      data,
    });

    return NextResponse.json(plan);
  } catch (error) {
    console.error("PUT /api/settings/insurance error:", error);
    return NextResponse.json(
      { error: "ไม่สามารถอัปเดตสิทธิการรักษาได้" },
      { status: 500 }
    );
  }
}
