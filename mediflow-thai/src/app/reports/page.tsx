import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  // Stats
  const [
    totalPatients,
    newPatientsThisMonth,
    totalVisitsThisMonth,
    totalVisitsToday,
    totalAppointmentsThisMonth,
    topDiagnoses,
    drugUsage,
    revenueThisMonth,
    doctorStats,
  ] = await Promise.all([
    prisma.patient.count(),
    prisma.patient.count({ where: { createdAt: { gte: thisMonth } } }),
    prisma.visit.count({ where: { visitDate: { gte: thisMonth } } }),
    prisma.visit.count({ where: { visitDate: { gte: today } } }),
    prisma.appointment.count({ where: { appointmentDate: { gte: thisMonth } } }),
    prisma.diagnosis.groupBy({
      by: ["diagnosisNameTh"],
      _count: true,
      orderBy: { _count: { diagnosisNameTh: "desc" } },
      take: 10,
      where: { diagnosisNameTh: { not: "" } },
    }),
    prisma.prescriptionItem.groupBy({
      by: ["drugId"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 10,
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { paidAt: { gte: thisMonth } },
    }),
    prisma.visit.groupBy({
      by: ["doctorId"],
      _count: true,
      where: { visitDate: { gte: thisMonth } },
      orderBy: { _count: { doctorId: "desc" } },
    }),
  ]);

  // Fetch drug names for usage report
  const drugIds = drugUsage.map(d => d.drugId);
  const drugsMap = await prisma.drug.findMany({
    where: { id: { in: drugIds } },
    select: { id: true, genericName: true, strength: true },
  });
  const drugLookup = Object.fromEntries(drugsMap.map(d => [d.id, d]));

  // Fetch doctor names
  const doctorIds = doctorStats.map(d => d.doctorId);
  const doctorsMap = await prisma.user.findMany({
    where: { id: { in: doctorIds } },
    select: { id: true, firstName: true, lastName: true },
  });
  const doctorLookup = Object.fromEntries(doctorsMap.map(d => [d.id, d]));

  const monthName = today.toLocaleDateString("th-TH", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">รายงาน</h1>
        <p className="text-sm text-gray-500">ข้อมูลประจำเดือน {monthName}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">ผู้ป่วยทั้งหมด</p>
          <p className="text-2xl font-bold text-blue-600">{totalPatients}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">ผู้ป่วยใหม่เดือนนี้</p>
          <p className="text-2xl font-bold text-green-600">{newPatientsThisMonth}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">การเข้าพบเดือนนี้</p>
          <p className="text-2xl font-bold text-purple-600">{totalVisitsThisMonth}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">นัดหมายเดือนนี้</p>
          <p className="text-2xl font-bold text-orange-600">{totalAppointmentsThisMonth}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">รายรับเดือนนี้</p>
          <p className="text-2xl font-bold text-green-600">฿{(revenueThisMonth._sum.amount || 0).toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Diagnoses */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">โรคที่พบบ่อย (Top 10)</h2>
          {topDiagnoses.length === 0 ? (
            <p className="text-gray-400 text-center py-4">ยังไม่มีข้อมูล</p>
          ) : (
            <div className="space-y-2">
              {topDiagnoses.map((d, idx) => (
                <div key={d.diagnosisNameTh} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center font-medium">{idx + 1}</span>
                    <span className="text-sm">{d.diagnosisNameTh}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-600">{d._count} ครั้ง</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Drug Usage */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">ยาที่ใช้บ่อย (Top 10)</h2>
          {drugUsage.length === 0 ? (
            <p className="text-gray-400 text-center py-4">ยังไม่มีข้อมูล</p>
          ) : (
            <div className="space-y-2">
              {drugUsage.map((d, idx) => {
                const drug = drugLookup[d.drugId];
                return (
                  <div key={d.drugId} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 text-xs flex items-center justify-center font-medium">{idx + 1}</span>
                      <span className="text-sm">{drug ? `${drug.genericName} ${drug.strength}` : d.drugId}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-600">{d._sum.quantity || 0} หน่วย</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Doctor Performance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">ผลงานแพทย์เดือนนี้</h2>
          {doctorStats.length === 0 ? (
            <p className="text-gray-400 text-center py-4">ยังไม่มีข้อมูล</p>
          ) : (
            <div className="space-y-2">
              {doctorStats.map((d) => {
                const doc = doctorLookup[d.doctorId];
                return (
                  <div key={d.doctorId} className="flex items-center justify-between">
                    <span className="text-sm">{doc ? `${doc.firstName} ${doc.lastName}` : d.doctorId}</span>
                    <span className="text-sm font-semibold text-gray-600">{d._count} visits</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">ข้อมูลวันนี้</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">วันที่</span>
              <span className="font-medium">{formatDate(today)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">ผู้ป่วยเข้าพบวันนี้</span>
              <span className="font-medium">{totalVisitsToday} ราย</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
