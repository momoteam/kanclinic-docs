import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const date = searchParams.get("date");
    const doctorId = searchParams.get("doctorId");
    const status = searchParams.get("status");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const nextDay = new Date(d);
      nextDay.setDate(nextDay.getDate() + 1);
      where.appointmentDate = { gte: d, lt: nextDay };
    } else {
      where.appointmentDate = { gte: today };
    }

    if (doctorId) {
      where.doctorId = doctorId;
    }

    if (status) {
      where.status = status;
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: true,
        doctor: true,
        service: true,
      },
      orderBy: [{ appointmentDate: "asc" }, { appointmentTime: "asc" }],
      take: 100,
    });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error("GET /api/appointments error:", error);
    return NextResponse.json(
      { error: "ไม่สามารถดึงข้อมูลนัดหมายได้" },
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

    const admin = await prisma.user.findFirst({
      where: { role: { in: ["Admin", "Receptionist", "Doctor"] } },
    });
    if (!admin) {
      return NextResponse.json({ error: "ไม่พบผู้ใช้งาน" }, { status: 400 });
    }

    const appointment = await prisma.appointment.create({
      data: {
        clinicId: clinic.id,
        patientId: body.patientId,
        doctorId: body.doctorId,
        serviceId: body.serviceId || null,
        appointmentDate: new Date(body.appointmentDate),
        appointmentTime: body.appointmentTime || "",
        durationMinutes: body.durationMinutes || 15,
        status: "Scheduled",
        notes: body.notes || "",
        createdById: admin.id,
      },
      include: {
        patient: true,
        doctor: true,
        service: true,
      },
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    console.error("POST /api/appointments error:", error);
    return NextResponse.json(
      { error: "ไม่สามารถสร้างนัดหมายได้" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "ต้องระบุ id" }, { status: 400 });
    }

    // Clean up fields that shouldn't be updated directly
    delete data.createdAt;
    delete data.updatedAt;
    delete data.patient;
    delete data.doctor;
    delete data.service;
    delete data.clinic;
    delete data.createdBy;
    delete data.queues;

    if (data.appointmentDate) {
      data.appointmentDate = new Date(data.appointmentDate);
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data,
      include: {
        patient: true,
        doctor: true,
        service: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/appointments error:", error);
    return NextResponse.json(
      { error: "ไม่สามารถอัปเดตนัดหมายได้" },
      { status: 500 }
    );
  }
}
