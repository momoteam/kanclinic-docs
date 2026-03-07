import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const rooms = await prisma.examinationRoom.findMany({
      include: {
        assignedDoctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { roomNumber: "asc" },
    });

    const doctors = await prisma.user.findMany({
      where: { role: "Doctor", isActive: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        specialization: true,
      },
      orderBy: { firstName: "asc" },
    });

    return NextResponse.json({ rooms, doctors });
  } catch (error) {
    console.error("GET /api/settings/rooms error:", error);
    return NextResponse.json(
      { error: "ไม่สามารถดึงข้อมูลห้องตรวจได้" },
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

    const room = await prisma.examinationRoom.create({
      data: {
        clinicId: clinic.id,
        roomNumber: body.roomNumber,
        roomName: body.roomName || "",
        roomType: body.roomType || "",
        assignedDoctorId: body.assignedDoctorId || null,
        status: body.status || "Available",
      },
      include: {
        assignedDoctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    console.error("POST /api/settings/rooms error:", error);
    return NextResponse.json(
      { error: "ไม่สามารถสร้างห้องตรวจได้" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, createdAt, updatedAt, clinicId, assignedDoctor, ...data } =
      body;

    if (!id) {
      return NextResponse.json(
        { error: "ต้องระบุ id ของห้องตรวจ" },
        { status: 400 }
      );
    }

    // Handle null doctor assignment
    if (data.assignedDoctorId === "") {
      data.assignedDoctorId = null;
    }

    const room = await prisma.examinationRoom.update({
      where: { id },
      data,
      include: {
        assignedDoctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json(room);
  } catch (error) {
    console.error("PUT /api/settings/rooms error:", error);
    return NextResponse.json(
      { error: "ไม่สามารถอัปเดตห้องตรวจได้" },
      { status: 500 }
    );
  }
}
