import { prisma } from "@/lib/prisma";
import { STATION_COLORS, formatDate } from "@/lib/utils";
import Link from "next/link";
import { Clock, Users, CheckCircle, AlertTriangle, FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DoctorPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const waitingQueues = await prisma.queue.findMany({
    where: {
      queueDate: { gte: today },
      currentStation: { in: ["WaitDoctor", "WithDoctor"] },
    },
    include: {
      patient: { include: { drugAllergies: true } },
      visit: {
        include: {
          screenings: { orderBy: { screenedAt: "desc" }, take: 1 },
        },
      },
    },
    orderBy: [
      { priority: "desc" },
      { createdAt: "asc" },
    ],
  });

  const completedToday = await prisma.visit.count({
    where: {
      visitDate: { gte: today },
      status: "Completed",
    },
  });

  const waitDoctorCount = waitingQueues.filter(q => q.currentStation === "WaitDoctor").length;
  const withDoctorCount = waitingQueues.filter(q => q.currentStation === "WithDoctor").length;

  // Calculate average wait time for waiting patients
  const waitTimes = waitingQueues
    .filter(q => q.currentStation === "WaitDoctor")
    .map(q => {
      const created = new Date(q.createdAt).getTime();
      const now = Date.now();
      return Math.round((now - created) / 60000); // minutes
    });
  const avgWaitTime = waitTimes.length > 0
    ? Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">โต๊ะแพทย์</h1>
        <p className="text-sm text-gray-500 mt-1">จัดการคิวตรวจและบันทึกการรักษา</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-orange-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">{waitDoctorCount}</p>
              <p className="text-xs text-gray-500">รอตรวจ</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-purple-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">{withDoctorCount}</p>
              <p className="text-xs text-gray-500">กำลังตรวจ</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{completedToday}</p>
              <p className="text-xs text-gray-500">ตรวจเสร็จวันนี้</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {avgWaitTime > 0 ? `${avgWaitTime}` : "-"}
              </p>
              <p className="text-xs text-gray-500">เวลารอเฉลี่ย (นาที)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Queue List */}
      {waitingQueues.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-lg">ไม่มีผู้ป่วยรอตรวจ</p>
          <p className="text-gray-300 text-sm mt-1">คิวจะแสดงเมื่อมีผู้ป่วยถูกส่งมาจากจุดคัดกรอง</p>
        </div>
      ) : (
        <div className="space-y-4">
          {waitingQueues.map((queue) => {
            const screening = queue.visit?.screenings?.[0];
            const waitMinutes = Math.round(
              (Date.now() - new Date(queue.createdAt).getTime()) / 60000
            );

            return (
              <div key={queue.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center text-lg font-bold text-purple-600">
                      {queue.queueNumber}
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-gray-900">
                        {queue.patient.title}{queue.patient.firstNameTh} {queue.patient.lastNameTh}
                      </p>
                      <p className="text-sm text-gray-500">
                        HN: {queue.patient.hn} | เพศ: {queue.patient.gender === "Male" ? "ชาย" : "หญิง"}
                        {queue.patient.dateOfBirth && ` | วันเกิด: ${formatDate(queue.patient.dateOfBirth)}`}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        รอมาแล้ว {waitMinutes} นาที
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATION_COLORS[queue.currentStation]}`}>
                      {queue.currentStation === "WaitDoctor" ? "รอตรวจ" : "กำลังตรวจ"}
                    </span>
                    {queue.priority !== "Normal" && (
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${queue.priority === "Emergency" ? "bg-red-600 text-white" : "bg-red-100 text-red-700"}`}>
                        {queue.priority === "Emergency" ? "ฉุกเฉิน" : "เร่งด่วน"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Alerts */}
                {queue.patient.drugAllergies.length > 0 && (
                  <div className="mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    แพ้ยา: {queue.patient.drugAllergies.map(a => a.drugName).join(", ")}
                  </div>
                )}

                {/* Screening data */}
                {screening && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs font-semibold text-blue-700 mb-1">ผลคัดกรอง</p>
                    <div className="flex flex-wrap gap-4 text-sm text-blue-800">
                      {screening.bloodPressureSys && (
                        <span>BP: {screening.bloodPressureSys}/{screening.bloodPressureDia}</span>
                      )}
                      {screening.pulseRate && <span>PR: {screening.pulseRate}</span>}
                      {screening.temperature && <span>Temp: {screening.temperature}°C</span>}
                      {screening.spo2 && <span>SpO2: {screening.spo2}%</span>}
                      {screening.weight && <span>W: {screening.weight} kg</span>}
                      {screening.bmi && <span>BMI: {screening.bmi.toFixed(1)}</span>}
                    </div>
                    {screening.chiefComplaint && (
                      <p className="text-sm text-blue-800 mt-1">CC: {screening.chiefComplaint}</p>
                    )}
                  </div>
                )}

                <div className="mt-4 flex gap-2 justify-end">
                  <Link
                    href={`/medical-records?patientId=${queue.patient.id}`}
                    className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <FileText className="w-4 h-4" />
                    ประวัติการรักษา
                  </Link>
                  <Link
                    href={`/patients/${queue.patient.id}`}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                  >
                    ดูประวัติ
                  </Link>
                  <Link
                    href={`/doctor/${queue.id}`}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
                  >
                    {queue.currentStation === "WaitDoctor" ? "เริ่มตรวจ" : "ดำเนินการต่อ"}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
