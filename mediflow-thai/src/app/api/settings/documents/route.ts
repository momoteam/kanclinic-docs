import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const clinic = await prisma.clinic.findFirst();
    if (!clinic) {
      return NextResponse.json([]);
    }

    const headers = await prisma.documentHeader.findMany({
      where: { clinicId: clinic.id },
      orderBy: { documentType: "asc" },
    });

    return NextResponse.json(headers);
  } catch (error) {
    console.error("GET /api/settings/documents error:", error);
    return NextResponse.json(
      { error: "ไม่สามารถดึงข้อมูลเอกสารได้" },
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

    // Check if document type already exists
    const existing = await prisma.documentHeader.findFirst({
      where: {
        clinicId: clinic.id,
        documentType: body.documentType,
      },
    });

    if (existing) {
      // Update existing
      const updated = await prisma.documentHeader.update({
        where: { id: existing.id },
        data: {
          logoUrl: body.logoUrl || "",
          logoPosition: body.logoPosition || "Left",
          headerLine1: body.headerLine1 || "",
          headerLine2: body.headerLine2 || "",
          headerLine3: body.headerLine3 || "",
          headerLine4: body.headerLine4 || "",
          footerText: body.footerText || "",
          fontSize: body.fontSize || 12,
          textColor: body.textColor || "#000000",
        },
      });
      return NextResponse.json(updated);
    }

    const header = await prisma.documentHeader.create({
      data: {
        clinicId: clinic.id,
        documentType: body.documentType || "Receipt",
        logoUrl: body.logoUrl || "",
        logoPosition: body.logoPosition || "Left",
        headerLine1: body.headerLine1 || "",
        headerLine2: body.headerLine2 || "",
        headerLine3: body.headerLine3 || "",
        headerLine4: body.headerLine4 || "",
        footerText: body.footerText || "",
        fontSize: body.fontSize || 12,
        textColor: body.textColor || "#000000",
      },
    });

    return NextResponse.json(header, { status: 201 });
  } catch (error) {
    console.error("POST /api/settings/documents error:", error);
    return NextResponse.json(
      { error: "ไม่สามารถสร้างข้อมูลเอกสารได้" },
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

    delete data.createdAt;
    delete data.updatedAt;
    delete data.clinic;

    const updated = await prisma.documentHeader.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/settings/documents error:", error);
    return NextResponse.json(
      { error: "ไม่สามารถอัปเดตข้อมูลเอกสารได้" },
      { status: 500 }
    );
  }
}
