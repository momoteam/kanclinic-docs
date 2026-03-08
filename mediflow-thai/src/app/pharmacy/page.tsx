import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  Pending: "รอจ่ายยา",
  Dispensing: "กำลังจัดยา",
  Dispensed: "จ่ายยาแล้ว",
  Cancelled: "ยกเลิก",
};

const STATUS_COLORS: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-700",
  Dispensing: "bg-blue-100 text-blue-700",
  Dispensed: "bg-green-100 text-green-700",
  Cancelled: "bg-gray-100 text-gray-500",
};

export default async function PharmacyPage() {
  const prescriptions = await prisma.prescription.findMany({
    include: {
      patient: { include: { drugAllergies: true } },
      doctor: true,
      items: { include: { drug: true } },
      dispensing: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const pending = prescriptions.filter(p => p.status === "Pending").length;
  const dispensing = prescriptions.filter(p => p.status === "Dispensing").length;
  const dispensed = prescriptions.filter(p => p.status === "Dispensed").length;

  // Drug stock alerts
  const lowStockDrugs = await prisma.drug.findMany({
    where: { isActive: true },
    include: {
      drugStocks: {
        select: { quantity: true },
      },
    },
  });

  const alerts = lowStockDrugs.filter(d => {
    const totalStock = d.drugStocks.reduce((sum, s) => sum + s.quantity, 0);
    return totalStock <= d.minStock && d.minStock > 0;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ห้องยา</h1>
        <p className="text-sm text-gray-500">
          รอจ่ายยา: <span className="font-semibold text-yellow-600">{pending}</span>
          {" | "}กำลังจัด: <span className="font-semibold text-blue-600">{dispensing}</span>
          {" | "}จ่ายแล้ว: <span className="font-semibold text-green-600">{dispensed}</span>
        </p>
      </div>

      {/* Drug stock alerts */}
      {alerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-red-700 mb-2">แจ้งเตือนยาใกล้หมด ({alerts.length} รายการ)</h3>
          <div className="flex flex-wrap gap-2">
            {alerts.map(d => (
              <span key={d.id} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                {d.genericName} ({d.drugStocks.reduce((s, st) => s + st.quantity, 0)}/{d.minStock})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Prescriptions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">ใบสั่งยา</h2>
        {prescriptions.length === 0 ? (
          <p className="text-gray-400 text-center py-8">ไม่มีใบสั่งยา</p>
        ) : (
          <div className="space-y-4">
            {prescriptions.map((rx) => (
              <div key={rx.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {rx.patient.title}{rx.patient.firstNameTh} {rx.patient.lastNameTh}
                    </p>
                    <p className="text-xs text-gray-500">
                      HN: {rx.patient.hn} | แพทย์: {rx.doctor.firstName} {rx.doctor.lastName} | {formatDateTime(rx.createdAt)}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[rx.status]}`}>
                    {STATUS_LABELS[rx.status] || rx.status}
                  </span>
                </div>

                {/* Drug allergy alert */}
                {rx.patient.drugAllergies.length > 0 && (
                  <div className="mb-3 px-3 py-1.5 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    แพ้ยา: {rx.patient.drugAllergies.map(a => a.drugName).join(", ")}
                  </div>
                )}

                {/* Prescription items */}
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-100">
                      <th className="pb-1 font-medium">#</th>
                      <th className="pb-1 font-medium">ยา</th>
                      <th className="pb-1 font-medium">Dosage</th>
                      <th className="pb-1 font-medium">วิธีใช้</th>
                      <th className="pb-1 font-medium">จำนวนวัน</th>
                      <th className="pb-1 font-medium">จำนวนรวม</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rx.items.map((item, idx) => (
                      <tr key={item.id} className="border-b border-gray-50">
                        <td className="py-1.5">{idx + 1}</td>
                        <td className="py-1.5 font-medium">{item.drug.genericName} {item.drug.strength}</td>
                        <td className="py-1.5">{item.dosage}</td>
                        <td className="py-1.5">{item.frequency}</td>
                        <td className="py-1.5">{item.durationDays} วัน</td>
                        <td className="py-1.5">{item.quantity} {item.drug.unit || "เม็ด"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Dispensing info */}
                {rx.dispensing && (
                  <div className="mt-2 p-2 bg-green-50 rounded text-sm text-green-700">
                    ตรวจแพ้ยา: {rx.dispensing.allergyChecked ? "✓" : "✗"}
                    {" | "}ตรวจปฏิกิริยา: {rx.dispensing.interactionChecked ? "✓" : "✗"}
                    {rx.dispensing.counselingNotes && ` | หมายเหตุ: ${rx.dispensing.counselingNotes}`}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
