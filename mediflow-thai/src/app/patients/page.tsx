import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { UserPlus, Search } from "lucide-react";
import { formatDate, calculateAge, maskIdCard } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PatientListPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">รายการผู้ป่วย</h1>
        <Link href="/patients/new" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm">
          <UserPlus className="w-4 h-4" /> ลงทะเบียนผู้ป่วยใหม่
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <form className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input name="q" defaultValue={q} placeholder="ค้นหาชื่อ, HN, เบอร์โทร..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <button type="submit" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">ค้นหา</button>
          </form>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left py-3 px-4 font-medium text-gray-500">HN</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">ชื่อ-นามสกุล</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">เลขบัตรประชาชน</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">เพศ</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">อายุ</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">เบอร์โทร</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">สิทธิ</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">วันที่ลงทะเบียน</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((p) => (
              <tr key={p.id} className="border-b border-gray-100 hover:bg-blue-50 cursor-pointer">
                <td className="py-3 px-4">
                  <Link href={`/patients/${p.id}`} className="font-mono text-blue-600 hover:underline">{p.hn}</Link>
                </td>
                <td className="py-3 px-4 font-medium">
                  <Link href={`/patients/${p.id}`}>{p.title}{p.firstNameTh} {p.lastNameTh}</Link>
                </td>
                <td className="py-3 px-4 text-gray-500">{maskIdCard(p.idCardNumber)}</td>
                <td className="py-3 px-4">{p.gender === "Male" ? "ชาย" : p.gender === "Female" ? "หญิง" : "อื่นๆ"}</td>
                <td className="py-3 px-4">{p.dateOfBirth ? calculateAge(p.dateOfBirth) : "-"} ปี</td>
                <td className="py-3 px-4">{p.phone}</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-700">{p.insurancePlan?.name || "จ่ายเอง"}</span>
                </td>
                <td className="py-3 px-4 text-gray-500">{formatDate(p.createdAt)}</td>
              </tr>
            ))}
            {patients.length === 0 && (
              <tr><td colSpan={8} className="py-8 text-center text-gray-500">ไม่พบข้อมูลผู้ป่วย</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
