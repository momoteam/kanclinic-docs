import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const queueId = request.nextUrl.searchParams.get("queueId");
  if (!queueId) {
    return NextResponse.json({ error: "queueId required" }, { status: 400 });
  }

  const queue = await prisma.queue.findUnique({
    where: { id: queueId },
    include: {
      patient: {
        include: { drugAllergies: true },
      },
    },
  });

  if (!queue) {
    return NextResponse.json({ error: "Queue not found" }, { status: 404 });
  }

  return NextResponse.json(queue);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    queueId, patientId,
    bloodPressureSys, bloodPressureDia, pulseRate, temperature,
    respiratoryRate, spo2, weight, height, bmi,
    chiefComplaint, painScale, triageLevel, notes,
  } = body;

  // Get a nurse user for screenedBy
  const nurse = await prisma.user.findFirst({
    where: { role: { in: ["Nurse", "Admin"] } },
  });
  if (!nurse) {
    return NextResponse.json({ error: "No nurse found" }, { status: 400 });
  }

  // Get queue to find visit or create one
  const queue = await prisma.queue.findUnique({
    where: { id: queueId },
    include: { patient: true },
  });
  if (!queue) {
    return NextResponse.json({ error: "Queue not found" }, { status: 404 });
  }

  // Get first doctor for visit
  const doctor = await prisma.user.findFirst({
    where: { role: "Doctor" },
  });
  if (!doctor) {
    return NextResponse.json({ error: "No doctor found" }, { status: 400 });
  }

  // Create visit if not exists
  let visitId = queue.visitId;
  if (!visitId) {
    const visit = await prisma.visit.create({
      data: {
        clinicId: queue.clinicId,
        patientId: queue.patientId,
        doctorId: doctor.id,
        visitType: queue.queueType === "Appointment" ? "Appointment" : "WalkIn",
        chiefComplaint: chiefComplaint || "",
      },
    });
    visitId = visit.id;

    await prisma.queue.update({
      where: { id: queueId },
      data: { visitId: visit.id },
    });
  }

  // Create screening record
  const screening = await prisma.screening.create({
    data: {
      visitId,
      patientId,
      screenedById: nurse.id,
      bloodPressureSys: bloodPressureSys ? parseInt(bloodPressureSys) : null,
      bloodPressureDia: bloodPressureDia ? parseInt(bloodPressureDia) : null,
      pulseRate: pulseRate ? parseInt(pulseRate) : null,
      temperature: temperature ? parseFloat(temperature) : null,
      respiratoryRate: respiratoryRate ? parseInt(respiratoryRate) : null,
      spo2: spo2 ? parseInt(spo2) : null,
      weight: weight ? parseFloat(weight) : null,
      height: height ? parseFloat(height) : null,
      bmi: bmi || null,
      chiefComplaint: chiefComplaint || "",
      painScale: painScale ? parseInt(painScale) : null,
      triageLevel: triageLevel || "5_NonUrgent",
      notes: notes || "",
    },
  });

  // Update queue station to WaitDoctor
  await prisma.queue.update({
    where: { id: queueId },
    data: { currentStation: "WaitDoctor" },
  });

  return NextResponse.json(screening, { status: 201 });
}
