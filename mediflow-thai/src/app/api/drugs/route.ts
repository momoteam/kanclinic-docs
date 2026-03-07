import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const drugs = await prisma.drug.findMany({
    where: { isActive: true },
    select: {
      id: true,
      genericName: true,
      tradeName: true,
      form: true,
      strength: true,
      unit: true,
      price: true,
    },
    orderBy: { genericName: "asc" },
  });
  return NextResponse.json(drugs);
}
