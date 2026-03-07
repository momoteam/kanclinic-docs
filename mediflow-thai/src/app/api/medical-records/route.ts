import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const visitId = req.nextUrl.searchParams.get("visitId");

  if (!visitId) {
    return NextResponse.json(
      { error: "visitId is required" },
      { status: 400 }
    );
  }

  const visit = await prisma.visit.findUnique({
    where: { id: visitId },
    include: {
      patient: {
        include: {
          drugAllergies: true,
        },
      },
      doctor: true,
      screenings: {
        orderBy: { screenedAt: "desc" },
        take: 1,
      },
      medicalRecords: {
        include: {
          diagnoses: true,
          signedBy: true,
        },
      },
    },
  });

  if (!visit) {
    return NextResponse.json({ error: "Visit not found" }, { status: 404 });
  }

  return NextResponse.json(visit);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const {
    visitId,
    patientId,
    doctorId,
    subjective,
    objective,
    assessment,
    plan,
    clinicalNotes,
    templateType,
    diagnoses,
  } = body;

  if (!visitId || !patientId || !doctorId) {
    return NextResponse.json(
      { error: "visitId, patientId, and doctorId are required" },
      { status: 400 }
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    // Create the medical record
    const medicalRecord = await tx.medicalRecord.create({
      data: {
        visitId,
        patientId,
        doctorId,
        subjective: subjective || "",
        objective: objective || "",
        assessment: assessment || "",
        plan: plan || "",
        clinicalNotes: clinicalNotes || "",
        templateType: templateType || "SOAP",
      },
    });

    // Create diagnoses if provided
    if (diagnoses && Array.isArray(diagnoses) && diagnoses.length > 0) {
      await tx.diagnosis.createMany({
        data: diagnoses.map(
          (d: {
            icd10Code?: string;
            diagnosisNameTh?: string;
            diagnosisNameEn?: string;
            diagnosisType?: string;
            notes?: string;
          }) => ({
            visitId,
            medicalRecordId: medicalRecord.id,
            patientId,
            doctorId,
            icd10Code: d.icd10Code || "",
            diagnosisNameTh: d.diagnosisNameTh || "",
            diagnosisNameEn: d.diagnosisNameEn || "",
            diagnosisType: d.diagnosisType || "Primary",
            notes: d.notes || "",
          })
        ),
      });
    }

    // Fetch the complete record with diagnoses
    return tx.medicalRecord.findUnique({
      where: { id: medicalRecord.id },
      include: { diagnoses: true, signedBy: true },
    });
  });

  return NextResponse.json(result, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();

  const {
    id,
    subjective,
    objective,
    assessment,
    plan,
    clinicalNotes,
    templateType,
    diagnoses,
    sign,
    signedById,
  } = body;

  if (!id) {
    return NextResponse.json(
      { error: "Medical record id is required" },
      { status: 400 }
    );
  }

  // Check if record is locked
  const existing = await prisma.medicalRecord.findUnique({
    where: { id },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Medical record not found" },
      { status: 404 }
    );
  }

  if (existing.isLocked) {
    return NextResponse.json(
      { error: "เวชระเบียนถูกล็อคแล้ว ไม่สามารถแก้ไขได้" },
      { status: 403 }
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    // Build update data
    const updateData: Record<string, unknown> = {};

    if (subjective !== undefined) updateData.subjective = subjective;
    if (objective !== undefined) updateData.objective = objective;
    if (assessment !== undefined) updateData.assessment = assessment;
    if (plan !== undefined) updateData.plan = plan;
    if (clinicalNotes !== undefined) updateData.clinicalNotes = clinicalNotes;
    if (templateType !== undefined) updateData.templateType = templateType;

    // Handle signing
    if (sign && signedById) {
      updateData.signedById = signedById;
      updateData.signedAt = new Date();
      updateData.isLocked = true;
    }

    const medicalRecord = await tx.medicalRecord.update({
      where: { id },
      data: updateData,
    });

    // Update diagnoses if provided - delete existing and recreate
    if (diagnoses && Array.isArray(diagnoses)) {
      await tx.diagnosis.deleteMany({
        where: { medicalRecordId: id },
      });

      if (diagnoses.length > 0) {
        await tx.diagnosis.createMany({
          data: diagnoses.map(
            (d: {
              icd10Code?: string;
              diagnosisNameTh?: string;
              diagnosisNameEn?: string;
              diagnosisType?: string;
              notes?: string;
            }) => ({
              visitId: medicalRecord.visitId,
              medicalRecordId: medicalRecord.id,
              patientId: medicalRecord.patientId,
              doctorId: medicalRecord.doctorId,
              icd10Code: d.icd10Code || "",
              diagnosisNameTh: d.diagnosisNameTh || "",
              diagnosisNameEn: d.diagnosisNameEn || "",
              diagnosisType: d.diagnosisType || "Primary",
              notes: d.notes || "",
            })
          ),
        });
      }
    }

    return tx.medicalRecord.findUnique({
      where: { id: medicalRecord.id },
      include: { diagnoses: true, signedBy: true },
    });
  });

  return NextResponse.json(result);
}
