import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const queues = await prisma.queue.findMany({
      where: {
        queueDate: { gte: today, lt: tomorrow },
      },
      include: {
        patient: true,
        appointment: true,
        room: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(queues);
  } catch (error) {
    console.error("GET /api/queue error:", error);
    return NextResponse.json(
      { error: "ไม่สามารถดึงข้อมูลคิวได้" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const clinic = await prisma.clinic.findFirst();
    if (!clinic) {
      return NextResponse.json({ error: "ไม่พบข้อมูลคลินิก" }, { status: 400 });
    }

    // Auto-generate queue number
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayCount = await prisma.queue.count({
      where: {
        queueDate: { gte: today, lt: tomorrow },
      },
    });

    const prefix = body.priority === "Emergency" ? "E" : body.priority === "Urgent" ? "U" : "A";
    const queueNumber = `${prefix}${String(todayCount + 1).padStart(3, "0")}`;

    const queue = await prisma.queue.create({
      data: {
        clinicId: clinic.id,
        patientId: body.patientId,
        appointmentId: body.appointmentId || null,
        queueNumber,
        queueType: body.queueType || "WalkIn",
        priority: body.priority || "Normal",
        currentStation: "WaitScreening",
        queueDate: new Date(),
      },
      include: {
        patient: true,
        appointment: true,
      },
    });

    return NextResponse.json(queue, { status: 201 });
  } catch (error) {
    console.error("POST /api/queue error:", error);
    return NextResponse.json(
      { error: "ไม่สามารถสร้างคิวได้" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, currentStation, roomId } = body;

    if (!id) {
      return NextResponse.json({ error: "ต้องระบุ id" }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};

    if (currentStation) {
      updateData.currentStation = currentStation;
      if (currentStation === "Completed") {
        updateData.completedAt = new Date();
      }
      if (currentStation === "WithDoctor" || currentStation === "Screening") {
        updateData.calledAt = new Date();
      }
    }

    if (roomId !== undefined) {
      updateData.roomId = roomId || null;
    }

    const updated = await prisma.queue.update({
      where: { id },
      data: updateData,
      include: {
        patient: true,
        appointment: true,
        room: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/queue error:", error);
    return NextResponse.json(
      { error: "ไม่สามารถอัปเดตคิวได้" },
      { status: 500 }
    );
  }
}
