import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        clinicId: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        licenseNumber: true,
        specialization: true,
        phone: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("GET /api/settings/users error:", error);
    return NextResponse.json(
      { error: "ไม่สามารถดึงข้อมูลผู้ใช้ได้" },
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

    // Check for duplicate email
    const existing = await prisma.user.findUnique({
      where: { email: body.email },
    });
    if (existing) {
      return NextResponse.json(
        { error: "อีเมลนี้ถูกใช้งานแล้ว" },
        { status: 400 }
      );
    }

    const user = await prisma.user.create({
      data: {
        clinicId: clinic.id,
        email: body.email,
        firstName: body.firstName,
        lastName: body.lastName,
        role: body.role || "Receptionist",
        licenseNumber: body.licenseNumber || "",
        specialization: body.specialization || "",
        phone: body.phone || "",
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("POST /api/settings/users error:", error);
    return NextResponse.json(
      { error: "ไม่สามารถสร้างผู้ใช้ได้" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, createdAt, updatedAt, lastLoginAt, clinicId, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ต้องระบุ id ของผู้ใช้" },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id },
      data,
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("PUT /api/settings/users error:", error);
    return NextResponse.json(
      { error: "ไม่สามารถอัปเดตผู้ใช้ได้" },
      { status: 500 }
    );
  }
}
