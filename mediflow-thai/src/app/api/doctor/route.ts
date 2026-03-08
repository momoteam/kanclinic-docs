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
      patient: { include: { drugAllergies: true } },
      visit: {
        include: {
          screenings: { orderBy: { screenedAt: "desc" }, take: 1 },
        },
      },
    },
  });

  if (!queue) {
    return NextResponse.json({ error: "Queue not found" }, { status: 404 });
  }

  // Update station to WithDoctor
  if (queue.currentStation === "WaitDoctor") {
    await prisma.queue.update({
      where: { id: queueId },
      data: { currentStation: "WithDoctor", calledAt: new Date() },
    });
  }

  return NextResponse.json(queue);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    queueId,
    visitId,
    patientId,
    soap,
    diagnosis,
    prescriptionItems,
    labOrders,
    nextStation,
  } = body;

  const doctor = await prisma.user.findFirst({ where: { role: "Doctor" } });
  if (!doctor) return NextResponse.json({ error: "No doctor" }, { status: 400 });

  // Get the clinic info from the queue
  const queue = await prisma.queue.findUnique({ where: { id: queueId } });
  if (!queue) return NextResponse.json({ error: "Queue not found" }, { status: 404 });

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Create or get the Visit
      let currentVisitId = visitId;
      if (!currentVisitId) {
        const visit = await tx.visit.create({
          data: {
            clinicId: queue.clinicId,
            patientId,
            doctorId: doctor.id,
            visitType: queue.queueType === "Appointment" ? "Appointment" : "WalkIn",
            chiefComplaint: soap?.subjective || "",
            status: "InProgress",
          },
        });
        currentVisitId = visit.id;

        // Link the visit to the queue
        await tx.queue.update({
          where: { id: queueId },
          data: { visitId: currentVisitId },
        });
      }

      // 2. Create Medical Record (SOAP)
      if (soap?.subjective || soap?.objective || soap?.assessment || soap?.plan) {
        await tx.medicalRecord.create({
          data: {
            visitId: currentVisitId,
            patientId,
            doctorId: doctor.id,
            subjective: soap.subjective || "",
            objective: soap.objective || "",
            assessment: soap.assessment || "",
            plan: soap.plan || "",
          },
        });
      }

      // 3. Create Diagnosis
      if (diagnosis?.icd10Code || diagnosis?.diagnosisNameTh) {
        await tx.diagnosis.create({
          data: {
            visitId: currentVisitId,
            patientId,
            doctorId: doctor.id,
            icd10Code: diagnosis.icd10Code || "",
            diagnosisNameTh: diagnosis.diagnosisNameTh || "",
            diagnosisNameEn: diagnosis.diagnosisNameEn || "",
            diagnosisType: diagnosis.diagnosisType || "Primary",
          },
        });
      }

      // 4. Create Prescription with items
      if (prescriptionItems && prescriptionItems.length > 0) {
        await tx.prescription.create({
          data: {
            visitId: currentVisitId,
            patientId,
            doctorId: doctor.id,
            items: {
              create: prescriptionItems.map(
                (item: {
                  drugId: string;
                  dosage: string;
                  frequency: string;
                  durationDays: string;
                  quantity: string;
                  usage?: string;
                }) => ({
                  drugId: item.drugId,
                  dosage: item.dosage || "",
                  frequency: item.frequency || "",
                  durationDays: parseInt(item.durationDays) || 1,
                  quantity: parseInt(item.quantity) || 1,
                  usageInstructions: item.usage || "",
                })
              ),
            },
          },
        });
      }

      // 5. Create Lab Orders
      if (labOrders && labOrders.length > 0) {
        for (const labOrder of labOrders) {
          if (!labOrder.labTestId) continue;
          await tx.labOrder.create({
            data: {
              visitId: currentVisitId,
              patientId,
              doctorId: doctor.id,
              labTestId: labOrder.labTestId,
              priority: labOrder.priority || "Normal",
              notes: labOrder.notes || "",
              status: "Pending",
            },
          });
        }
      }

      // 6. Update Visit
      await tx.visit.update({
        where: { id: currentVisitId },
        data: {
          chiefComplaint: soap?.subjective || "",
          status: nextStation === "Completed" ? "Completed" : "InProgress",
        },
      });

      // 7. Update Queue station
      await tx.queue.update({
        where: { id: queueId },
        data: {
          currentStation: nextStation || "WaitPharmacy",
          ...(nextStation === "Completed" ? { completedAt: new Date() } : {}),
        },
      });
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Doctor POST error:", error);
    return NextResponse.json(
      { error: "Failed to save doctor records" },
      { status: 500 }
    );
  }
}
