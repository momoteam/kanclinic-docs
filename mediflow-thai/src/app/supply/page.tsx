import { prisma } from "@/lib/prisma";
import { Package, PackagePlus, PackageMinus, AlertTriangle, Clock } from "lucide-react";
import { formatDate, SUPPLY_MOVEMENT_LABELS, SUPPLY_MOVEMENT_COLORS } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SupplyDashboardPage() {
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalItems,
    pendingRequisitions,
    receivedThisMonth,
    disbursedThisMonth,
    recentMovements,
    allItems,
  ] = await Promise.all([
    prisma.supplyItem.count({ where: { isActive: true } }),
    prisma.supplyRequisition.count({ where: { status: "Pending" } }),
    prisma.supplyMovement.count({
      where: { movementType: "Receive", createdAt: { gte: thisMonth } },
    }),
    prisma.supplyMovement.count({
      where: { movementType: "Disburse", createdAt: { gte: thisMonth } },
    }),
    prisma.supplyMovement.findMany({
      include: {
        supplyItem: { select: { code: true, nameTh: true, unit: true } },
        performedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.supplyItem.findMany({
      where: { isActive: true, minStock: { gt: 0 } },
      include: { stocks: { select: { quantity: true } } },
    }),
  ]);

  const lowStockItems = allItems.filter((item) => {
    const totalStock = item.stocks.reduce((sum, s) => sum + s.quantity, 0);
    return totalStock < item.minStock;
  });

  const stats = [
    { label: "รายการพัสดุทั้งหมด", value: totalItems, icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "ใบเบิกรออนุมัติ", value: pendingRequisitions, icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50" },
    { label: "รับเข้าเดือนนี้", value: receivedThisMonth, icon: PackagePlus, color: "text-green-600", bg: "bg-green-50" },
    { label: "เบิกจ่ายเดือนนี้", value: disbursedThisMonth, icon: PackageMinus, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ระบบบริหารจัดการคลังพัสดุ</h1>
        <p className="text-gray-500">แดชบอร์ด</p>
      </div>

      {pendingRequisitions > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
          <Clock className="w-5 h-5 text-yellow-600" />
          <span className="text-yellow-800 font-medium">{pendingRequisitions} ใบเบิกรออนุมัติ</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.bg} p-3 rounded-lg`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {lowStockItems.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-semibold text-gray-900">พัสดุต่ำกว่าขั้นต่ำ ({lowStockItems.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">รหัส</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">ชื่อพัสดุ</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">คงเหลือ</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">ขั้นต่ำ</th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.map((item) => {
                  const totalStock = item.stocks.reduce((sum, s) => sum + s.quantity, 0);
                  return (
                    <tr key={item.id} className="border-b border-gray-100">
                      <td className="py-2 px-3 font-mono text-xs">{item.code}</td>
                      <td className="py-2 px-3">{item.nameTh}</td>
                      <td className="py-2 px-3 text-right text-red-600 font-medium">{totalStock}</td>
                      <td className="py-2 px-3 text-right text-gray-500">{item.minStock}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">กิจกรรมล่าสุด</h2>
        {recentMovements.length === 0 ? (
          <p className="text-gray-400 text-center py-8">ยังไม่มีกิจกรรม</p>
        ) : (
          <div className="space-y-3">
            {recentMovements.map((mv) => (
              <div key={mv.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${SUPPLY_MOVEMENT_COLORS[mv.movementType] || "text-gray-600"}`}>
                      {SUPPLY_MOVEMENT_LABELS[mv.movementType] || mv.movementType}
                    </span>
                    <span className="text-sm text-gray-900">
                      {mv.supplyItem.code} - {mv.supplyItem.nameTh}
                    </span>
                  </div>
                  {mv.notes && <p className="text-xs text-gray-500 mt-0.5">{mv.notes}</p>}
                </div>
                <div className="text-right">
                  <span className={`text-sm font-medium ${mv.quantity > 0 ? "text-green-600" : "text-red-600"}`}>
                    {mv.quantity > 0 ? "+" : ""}{mv.quantity} {mv.supplyItem.unit}
                  </span>
                  <p className="text-xs text-gray-400">{formatDate(mv.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
