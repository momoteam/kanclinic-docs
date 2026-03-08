import { prisma } from "@/lib/prisma";
import { Users, Calendar, ClipboardList, Stethoscope } from "lucide-react";

export const dynamic = "force-dynamic";

async function getStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [patientCount, todayAppointments, activeQueues, todayVisits] = await Promise.all([
    prisma.patient.count(),
    prisma.appointment.count({ where: { appointmentDate: { gte: today, lt: tomorrow } } }),
    prisma.queue.count({ where: { queueDate: { gte: today, lt: tomorrow }, currentStation: { not: "Completed" } } }),
    prisma.visit.count({ where: { visitDate: { gte: today, lt: tomorrow } } }),
  ]);
  return { patientCount, todayAppointments, activeQueues, todayVisits };
}

async function getTodayQueues() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return prisma.queue.findMany({
    where: { queueDate: { gte: today, lt: tomorrow }, currentStation: { not: "Completed" } },
    include: { patient: true },
    orderBy: { createdAt: "asc" },
    take: 10,
  });
}

const STATION_LABELS: Record<string, string> = {
  WaitScreening: "รอคัดกรอง", Screening: "กำลังคัดกรอง", WaitDoctor: "รอพบแพทย์",
  WithDoctor: "กำลังตรวจ", WaitPharmacy: "รอรับยา", WaitPayment: "รอชำระเงิน", Completed: "เสร็จสิ้น",
};
const STATION_COLORS: Record<string, string> = {
  WaitScreening: "bg-yellow-100 text-yellow-800", Screening: "bg-blue-100 text-blue-800",
  WaitDoctor: "bg-orange-100 text-orange-800", WithDoctor: "bg-purple-100 text-purple-800",
  WaitPharmacy: "bg-cyan-100 text-cyan-800", WaitPayment: "bg-pink-100 text-pink-800",
  Completed: "bg-green-100 text-green-800",
};

export default async function Dashboard() {
  const stats = await getStats();
  const queues = await getTodayQueues();
  const cards = [
    { label: "ผู้ป่วยทั้งหมด", value: stats.patientCount, icon: Users, color: "bg-blue-500" },
    { label: "นัดหมายวันนี้", value: stats.todayAppointments, icon: Calendar, color: "bg-green-500" },
    { label: "คิวรอวันนี้", value: stats.activeQueues, icon: ClipboardList, color: "bg-orange-500" },
    { label: "ให้บริการแล้ว", value: stats.todayVisits, icon: Stethoscope, color: "bg-purple-500" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
              </div>
              <div className={`${card.color} p-3 rounded-lg`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">คิวผู้ป่วยวันนี้</h2>
        {queues.length === 0 ? (
          <p className="text-gray-500 text-sm">ไม่มีคิวในขณะนี้</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-500">เลขคิว</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">ผู้ป่วย</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">ประเภท</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">ความเร่งด่วน</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {queues.map((q) => (
                <tr key={q.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono font-bold text-blue-600">{q.queueNumber}</td>
                  <td className="py-3 px-4">{q.patient.title}{q.patient.firstNameTh} {q.patient.lastNameTh}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs ${q.queueType === "WalkIn" ? "bg-gray-100 text-gray-700" : "bg-blue-100 text-blue-700"}`}>
                      {q.queueType === "WalkIn" ? "Walk-in" : "นัดหมาย"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs ${q.priority === "Urgent" ? "bg-red-100 text-red-700" : q.priority === "Emergency" ? "bg-red-500 text-white" : "bg-gray-100 text-gray-700"}`}>
                      {q.priority === "Normal" ? "ปกติ" : q.priority === "Urgent" ? "เร่งด่วน" : "ฉุกเฉิน"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs ${STATION_COLORS[q.currentStation] || "bg-gray-100"}`}>
                      {STATION_LABELS[q.currentStation] || q.currentStation}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
