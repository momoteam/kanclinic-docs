import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatDate, calculateAge } from "@/lib/utils";
import { AlertTriangle, Heart, Phone, Mail } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PatientProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      insurancePlan: true,
      drugAllergies: true,
      visits: { include: { doctor: true }, orderBy: { visitDate: "desc" }, take: 10 },
      appointments: { include: { doctor: true }, orderBy: { appointmentDate: "desc" }, take: 10 },
    },
  });

  if (!patient) return notFound();

  const diseases: string[] = JSON.parse(patient.underlyingDiseases || "[]");

  return (
    <div>
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-2xl font-bold text-blue-600">
            {patient.firstNameTh[0]}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {patient.title}{patient.firstNameTh} {patient.lastNameTh}
              </h1>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-mono">{patient.hn}</span>
            </div>
            <div className="flex items-center gap-6 mt-2 text-sm text-gray-600">
              <span>{patient.gender === "Male" ? "ชาย" : patient.gender === "Female" ? "หญิง" : "อื่นๆ"}</span>
              {patient.dateOfBirth && <span>อายุ {calculateAge(patient.dateOfBirth)} ปี</span>}
              {patient.bloodType && <span>กรุ๊ปเลือด {patient.bloodType}</span>}
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{patient.insurancePlan?.name || "จ่ายเอง"}</span>
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              {patient.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{patient.phone}</span>}
              {patient.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{patient.email}</span>}
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="flex gap-3 mt-4">
          {patient.drugAllergies.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium">แพ้ยา:</span>
              {patient.drugAllergies.map(a => a.drugName).join(", ")}
            </div>
          )}
          {diseases.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-700">
              <Heart className="w-4 h-4" />
              <span className="font-medium">โรคประจำตัว:</span>
              {diseases.join(", ")}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ข้อมูลส่วนตัว */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">ข้อมูลส่วนตัว</h2>
          <dl className="space-y-3 text-sm">
            {[
              ["เลขบัตรประชาชน", patient.idCardNumber || "-"],
              ["วันเกิด", patient.dateOfBirth ? formatDate(patient.dateOfBirth) : "-"],
              ["สัญชาติ", patient.nationality || "-"],
              ["ศาสนา", patient.religion || "-"],
              ["Line ID", patient.lineId || "-"],
              ["ที่อยู่", `${patient.address} ${patient.subDistrict} ${patient.district} ${patient.province} ${patient.postalCode}`.trim() || "-"],
            ].map(([label, value]) => (
              <div key={label as string} className="flex">
                <dt className="w-40 text-gray-500 flex-shrink-0">{label}</dt>
                <dd className="text-gray-900">{value}</dd>
              </div>
            ))}
          </dl>
          {patient.emergencyContactName && (
            <>
              <h3 className="text-sm font-semibold text-gray-700 mt-4 mb-2">ผู้ติดต่อฉุกเฉิน</h3>
              <p className="text-sm text-gray-600">
                {patient.emergencyContactName} ({patient.emergencyContactRelation}) - {patient.emergencyContactPhone}
              </p>
            </>
          )}
        </div>

        {/* ประวัติการรักษา */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">ประวัติการรักษาล่าสุด</h2>
          {patient.visits.length === 0 ? (
            <p className="text-sm text-gray-500">ยังไม่มีประวัติการรักษา</p>
          ) : (
            <div className="space-y-3">
              {patient.visits.map(v => (
                <div key={v.id} className="border-l-4 border-blue-400 pl-3 py-1">
                  <p className="text-sm font-medium">{formatDate(v.visitDate)}</p>
                  <p className="text-xs text-gray-500">แพทย์: {v.doctor.firstName} {v.doctor.lastName}</p>
                  {v.chiefComplaint && <p className="text-xs text-gray-600 mt-1">อาการ: {v.chiefComplaint}</p>}
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs ${v.status === "Completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {v.status === "Completed" ? "เสร็จสิ้น" : v.status === "InProgress" ? "กำลังดำเนินการ" : "ยกเลิก"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* นัดหมาย */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">นัดหมาย</h2>
          {patient.appointments.length === 0 ? (
            <p className="text-sm text-gray-500">ไม่มีนัดหมาย</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">วันที่</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">เวลา</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">แพทย์</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {patient.appointments.map(a => (
                  <tr key={a.id} className="border-b border-gray-100">
                    <td className="py-2 px-3">{formatDate(a.appointmentDate)}</td>
                    <td className="py-2 px-3">{a.appointmentTime}</td>
                    <td className="py-2 px-3">{a.doctor.firstName} {a.doctor.lastName}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        a.status === "Completed" ? "bg-green-100 text-green-700" :
                        a.status === "Cancelled" ? "bg-red-100 text-red-700" :
                        a.status === "Confirmed" ? "bg-blue-100 text-blue-700" :
                        "bg-yellow-100 text-yellow-700"
                      }`}>{a.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
