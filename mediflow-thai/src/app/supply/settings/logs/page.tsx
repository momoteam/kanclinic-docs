import { prisma } from "@/lib/prisma";
import { ScrollText } from "lucide-react";
import { formatDateTime, SUPPLY_MOVEMENT_LABELS } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ActivityLogsPage() {
  const movements = await prisma.supplyMovement.findMany({
    include: {
      supplyItem: { select: { code: true, nameTh: true, unit: true } },
      performedBy: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ScrollText className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">บันทึกการใช้งาน</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-gray-500">วันที่</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">ประเภท</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">รหัสพัสดุ</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">ชื่อพัสดุ</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500">จำนวน</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">หมายเหตุ</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">ผู้ดำเนินการ</th>
            </tr>
          </thead>
          <tbody>
            {movements.map((m) => (
              <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 text-xs text-gray-500">{formatDateTime(m.createdAt)}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    m.movementType.includes("Adjust") || m.movementType === "Receive" ? "bg-blue-100 text-blue-700"
                    : m.movementType === "Disburse" ? "bg-orange-100 text-orange-700"
                    : m.movementType === "WriteOff" ? "bg-red-100 text-red-700"
                    : "bg-gray-100 text-gray-600"
                  }`}>
                    {SUPPLY_MOVEMENT_LABELS[m.movementType] || m.movementType}
                  </span>
                </td>
                <td className="py-3 px-4 font-mono text-xs">{m.supplyItem.code}</td>
                <td className="py-3 px-4">{m.supplyItem.nameTh}</td>
                <td className={`py-3 px-4 text-right font-medium ${m.quantity > 0 ? "text-green-600" : "text-red-600"}`}>
                  {m.quantity > 0 ? "+" : ""}{m.quantity} {m.supplyItem.unit}
                </td>
                <td className="py-3 px-4 text-gray-500 max-w-xs truncate">{m.notes || "-"}</td>
                <td className="py-3 px-4 text-gray-500">{m.performedBy.firstName} {m.performedBy.lastName}</td>
              </tr>
            ))}
            {movements.length === 0 && (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">ยังไม่มีบันทึก</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
