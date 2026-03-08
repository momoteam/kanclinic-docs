import { prisma } from "@/lib/prisma";
import { STATION_LABELS, STATION_COLORS, formatDateTime } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ScreeningPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const queues = await prisma.queue.findMany({
    where: {
      queueDate: { gte: today },
      currentStation: { in: ["WaitScreening", "Screening"] },
    },
    include: {
      patient: { include: { drugAllergies: true } },
    },
    orderBy: [
      { priority: "desc" },
      { createdAt: "asc" },
    ],
  });

  const screenings = await prisma.screening.findMany({
    where: { screenedAt: { gte: today } },
    include: {
      patient: true,
      screenedBy: true,
      visit: true,
    },
    orderBy: { screenedAt: "desc" },
    take: 10,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">คัดกรองผู้ป่วย</h1>
        <p className="text-sm text-gray-500">
          รอคัดกรอง: <span className="font-semibold text-yellow-600">{queues.filter(q => q.currentStation === "WaitScreening").length}</span>
          {" | "}กำลังคัดกรอง: <span className="font-semibold text-blue-600">{queues.filter(q => q.currentStation === "Screening").length}</span>
        </p>
      </div>

      {/* คิวรอคัดกรอง */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">คิวรอคัดกรอง</h2>
        {queues.length === 0 ? (
          <p className="text-gray-400 text-center py-8">ไม่มีคิวรอคัดกรอง</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {queues.map((queue) => (
              <Link
                key={queue.id}
                href={`/screening/${queue.id}`}
                className="block border border-gray-200 rounded-lg p-4 hover:border-blue-400 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold text-blue-600">{queue.queueNumber}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATION_COLORS[queue.currentStation] || "bg-gray-100 text-gray-800"}`}>
                    {STATION_LABELS[queue.currentStation] || queue.currentStation}
                  </span>
                </div>
                <p className="font-medium text-gray-900">
                  {queue.patient.title}{queue.patient.firstNameTh} {queue.patient.lastNameTh}
                </p>
                <p className="text-xs text-gray-500">HN: {queue.patient.hn}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-2 py-0.5 rounded text-xs ${queue.queueType === "Appointment" ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-700"}`}>
                    {queue.queueType === "Appointment" ? "นัดหมาย" : "Walk-in"}
                  </span>
                  {queue.priority === "Urgent" && (
                    <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-700 font-medium">เร่งด่วน</span>
                  )}
                  {queue.priority === "Emergency" && (
                    <span className="px-2 py-0.5 rounded text-xs bg-red-600 text-white font-medium">ฉุกเฉิน</span>
                  )}
                </div>
                {queue.patient.drugAllergies.length > 0 && (
                  <p className="text-xs text-red-600 mt-2">
                    แพ้ยา: {queue.patient.drugAllergies.map(a => a.drugName).join(", ")}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ประวัติคัดกรองวันนี้ */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">ประวัติคัดกรองวันนี้</h2>
        {screenings.length === 0 ? (
          <p className="text-gray-400 text-center py-4">ยังไม่มีการคัดกรองวันนี้</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="pb-2 font-medium">เวลา</th>
                <th className="pb-2 font-medium">ผู้ป่วย</th>
                <th className="pb-2 font-medium">BP</th>
                <th className="pb-2 font-medium">PR</th>
                <th className="pb-2 font-medium">Temp</th>
                <th className="pb-2 font-medium">SpO2</th>
                <th className="pb-2 font-medium">BMI</th>
                <th className="pb-2 font-medium">Triage</th>
                <th className="pb-2 font-medium">ผู้คัดกรอง</th>
              </tr>
            </thead>
            <tbody>
              {screenings.map((s) => (
                <tr key={s.id} className="border-b border-gray-100">
                  <td className="py-2">{formatDateTime(s.screenedAt)}</td>
                  <td className="py-2">{s.patient.firstNameTh} {s.patient.lastNameTh}</td>
                  <td className="py-2">{s.bloodPressureSys && s.bloodPressureDia ? `${s.bloodPressureSys}/${s.bloodPressureDia}` : "-"}</td>
                  <td className="py-2">{s.pulseRate || "-"}</td>
                  <td className="py-2">{s.temperature ? `${s.temperature}°C` : "-"}</td>
                  <td className="py-2">{s.spo2 ? `${s.spo2}%` : "-"}</td>
                  <td className="py-2">{s.bmi ? s.bmi.toFixed(1) : "-"}</td>
                  <td className="py-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      s.triageLevel.startsWith("1") ? "bg-red-600 text-white" :
                      s.triageLevel.startsWith("2") ? "bg-red-100 text-red-700" :
                      s.triageLevel.startsWith("3") ? "bg-yellow-100 text-yellow-700" :
                      s.triageLevel.startsWith("4") ? "bg-green-100 text-green-700" :
                      "bg-blue-100 text-blue-700"
                    }`}>
                      {s.triageLevel.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-2">{s.screenedBy.firstName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
