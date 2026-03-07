import { prisma } from "@/lib/prisma";
import { generateHN } from "@/lib/utils";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  const patients = await prisma.patient.findMany({
    where: q ? {
      OR: [
        { firstNameTh: { contains: q } },
        { lastNameTh: { contains: q } },
        { hn: { contains: q } },
        { phone: { contains: q } },
      ],
    } : undefined,
    include: { insurancePlan: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(patients);
}

export async function POST(request: Request) {
  const body = await request.json();

  // Get first clinic
  const clinic = await prisma.clinic.findFirst();
  if (!clinic) return NextResponse.json({ error: "No clinic found" }, { status: 400 });

  const patient = await prisma.patient.create({
    data: {
      clinicId: clinic.id,
      hn: generateHN(),
      title: body.title || "",
      firstNameTh: body.firstNameTh,
      lastNameTh: body.lastNameTh,
      firstNameEn: body.firstNameEn || "",
      lastNameEn: body.lastNameEn || "",
      idCardNumber: body.idCardNumber || "",
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
      gender: body.gender || "Male",
      bloodType: body.bloodType || "",
      phone: body.phone || "",
      lineId: body.lineId || "",
      email: body.email || "",
      address: body.address || "",
      subDistrict: body.subDistrict || "",
      district: body.district || "",
      province: body.province || "",
      postalCode: body.postalCode || "",
      emergencyContactName: body.emergencyContactName || "",
      emergencyContactRelation: body.emergencyContactRelation || "",
      emergencyContactPhone: body.emergencyContactPhone || "",
    },
  });

  return NextResponse.json(patient, { status: 201 });
}
