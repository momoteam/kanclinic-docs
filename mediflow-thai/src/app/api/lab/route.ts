import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get("action");

  // Return available lab tests for doctor ordering
  if (action === "tests") {
    const tests = await prisma.labTest.findMany({
      where: { isActive: true },
      orderBy: [{ category: "asc" }, { nameTh: "asc" }],
    });
    return NextResponse.json(tests);
  }

  // Default: return lab orders with results
  const status = req.nextUrl.searchParams.get("status");
  const patientId = req.nextUrl.searchParams.get("patientId");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (patientId) where.patientId = patientId;

  const labOrders = await prisma.labOrder.findMany({
    where: Object.keys(where).length > 0 ? where : undefined,
    include: {
      patient: true,
      doctor: true,
      labTest: true,
      labResult: {
        include: {
          performedBy: true,
          verifiedBy: true,
        },
      },
      visit: true,
    },
    orderBy: { orderedAt: "desc" },
    take: 100,
  });

  return NextResponse.json(labOrders);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const { visitId, patientId, doctorId, labTestId, priority, notes } = body;

  if (!visitId || !patientId || !doctorId || !labTestId) {
    return NextResponse.json(
      { error: "visitId, patientId, doctorId, and labTestId are required" },
      { status: 400 }
    );
  }

  const labOrder = await prisma.labOrder.create({
    data: {
      visitId,
      patientId,
      doctorId,
      labTestId,
      priority: priority || "Normal",
      notes: notes || "",
      status: "Pending",
    },
    include: {
      patient: true,
      doctor: true,
      labTest: true,
    },
  });

  return NextResponse.json(labOrder, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();

  const {
    labOrderId,
    resultValue,
    resultUnit,
    normalRange,
    isAbnormal,
    interpretation,
    performedById,
    verifiedById,
    status,
  } = body;

  if (!labOrderId) {
    return NextResponse.json(
      { error: "labOrderId is required" },
      { status: 400 }
    );
  }

  // Check if order exists
  const order = await prisma.labOrder.findUnique({
    where: { id: labOrderId },
    include: { labResult: true, labTest: true },
  });

  if (!order) {
    return NextResponse.json(
      { error: "Lab order not found" },
      { status: 404 }
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    // Update order status
    if (status) {
      await tx.labOrder.update({
        where: { id: labOrderId },
        data: { status },
      });
    }

    // Create or update lab result
    if (resultValue !== undefined && performedById) {
      if (order.labResult) {
        // Update existing result
        await tx.labResult.update({
          where: { id: order.labResult.id },
          data: {
            resultValue: resultValue || "",
            resultUnit: resultUnit || order.labTest.unit || "",
            normalRange: normalRange || order.labTest.normalRange || "",
            isAbnormal: isAbnormal || false,
            interpretation: interpretation || "",
            verifiedById: verifiedById || null,
            resultAt: new Date(),
          },
        });
      } else {
        // Create new result
        await tx.labResult.create({
          data: {
            labOrderId,
            patientId: order.patientId,
            resultValue: resultValue || "",
            resultUnit: resultUnit || order.labTest.unit || "",
            normalRange: normalRange || order.labTest.normalRange || "",
            isAbnormal: isAbnormal || false,
            interpretation: interpretation || "",
            performedById,
            verifiedById: verifiedById || null,
          },
        });
      }

      // Update order status to Completed
      await tx.labOrder.update({
        where: { id: labOrderId },
        data: { status: "Completed" },
      });
    }

    return tx.labOrder.findUnique({
      where: { id: labOrderId },
      include: {
        patient: true,
        doctor: true,
        labTest: true,
        labResult: {
          include: {
            performedBy: true,
            verifiedBy: true,
          },
        },
      },
    });
  });

  return NextResponse.json(result);
}
