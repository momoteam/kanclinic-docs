import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { FileText, Search } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const RECORD_STATUS_COLORS: Record<string, string> = {
  signed: "bg-green-100 text-green-700",
  draft: "bg-yellow-100 text-yellow-700",
};

export default async function MedicalRecordsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const records = await prisma.medicalRecord.findMany({
    where: q
      ? {
          OR: [
            { patient: { firstNameTh: { contains: q } } },
            { patient: { lastNameTh: { contains: q } } },
            { patient: { hn: { contains: q } } },
          ],
        }
      : undefined,
    include: {
      patient: true,
      doctor: true,
      visit: true,
      diagnoses: true,
      signedBy: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const totalRecords = records.length;
  const signedCount = records.filter((r) => r.signedById).length;
  const draftCount = records.filter((r) => !r.signedById).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">เวชระเบียน</h1>
          <p className="text-sm text-gray-500 mt-1">
            ทั้งหมด: {totalRecords} | ลงนามแล้ว:{" "}
            <span className="font-semibold text-green-600">{signedCount}</span>{" "}
            | ร่าง:{" "}
            <span className="font-semibold text-yellow-600">{draftCount}</span>
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <form method="GET" className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              name="q"
              defaultValue={q || ""}
              placeholder="ค้นหาด้วยชื่อผู้ป่วยหรือ HN..."
              className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 transition"
          >
            ค้นหา
          </button>
          {q && (
            <Link
              href="/medical-records"
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2"
            >
              ล้าง
            </Link>
          )}
        </form>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {records.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">
              {q ? "ไม่พบเวชระเบียนที่ค้นหา" : "ยังไม่มีเวชระเบียน"}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="pb-3 font-medium">วันที่</th>
                <th className="pb-3 font-medium">HN</th>
                <th className="pb-3 font-medium">ผู้ป่วย</th>
                <th className="pb-3 font-medium">แพทย์</th>
                <th className="pb-3 font-medium">ประเภท</th>
                <th className="pb-3 font-medium">การวินิจฉัย</th>
                <th className="pb-3 font-medium">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => {
                const isSigned = !!record.signedById;
                const primaryDiagnosis = record.diagnoses.find(
                  (d) => d.diagnosisType === "Primary"
                );

                return (
                  <tr
                    key={record.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition"
                  >
                    <td className="py-3 text-gray-600">
                      {formatDate(record.createdAt)}
                    </td>
                    <td className="py-3 font-mono text-gray-500">
                      {record.patient.hn}
                    </td>
                    <td className="py-3">
                      <Link
                        href={`/medical-records/${record.visitId}`}
                        className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {record.patient.title}
                        {record.patient.firstNameTh}{" "}
                        {record.patient.lastNameTh}
                      </Link>
                    </td>
                    <td className="py-3 text-gray-700">
                      {record.doctor.firstName} {record.doctor.lastName}
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                        {record.templateType}
                      </span>
                    </td>
                    <td className="py-3 text-gray-600 max-w-[200px] truncate">
                      {primaryDiagnosis
                        ? `${primaryDiagnosis.icd10Code} - ${primaryDiagnosis.diagnosisNameTh}`
                        : "-"}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          isSigned
                            ? RECORD_STATUS_COLORS.signed
                            : RECORD_STATUS_COLORS.draft
                        }`}
                      >
                        {isSigned ? "ลงนามแล้ว" : "ร่าง"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
