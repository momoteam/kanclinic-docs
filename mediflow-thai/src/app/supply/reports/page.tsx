import { prisma } from "@/lib/prisma";
import { BarChart3 } from "lucide-react";
import { formatDate, formatCurrency, SUPPLY_MOVEMENT_LABELS } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SupplyReportsPage() {
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    totalItems,
    totalCategories,
    movements,
    requisitions,
    allItems,
  ] = await Promise.all([
    prisma.supplyItem.count({ where: { isActive: true } }),
    prisma.supplyCategory.count({ where: { isActive: true } }),
    prisma.supplyMovement.findMany({
      where: { createdAt: { gte: lastMonth } },
      include: {
        supplyItem: { select: { code: true, nameTh: true, unit: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.supplyRequisition.findMany({
      where: { createdAt: { gte: lastMonth } },
      include: { department: { select: { nameTh: true } } },
    }),
    prisma.supplyItem.findMany({
      where: { isActive: true },
      include: { stocks: { select: { quantity: true, unitCost: true } } },
    }),
  ]);

  const thisMonthMovements = movements.filter((m) => new Date(m.createdAt) >= thisMonth);
  const receivedThisMonth = thisMonthMovements.filter((m) => m.movementType === "Receive").length;
  const disbursedThisMonth = thisMonthMovements.filter((m) => m.movementType === "Disburse").length;

  const totalStockValue = allItems.reduce((sum, item) => {
    return sum + item.stocks.reduce((s, st) => s + st.quantity * st.unitCost, 0);
  }, 0);

  const lowStockCount = allItems.filter((item) => {
    const total = item.stocks.reduce((s, st) => s + st.quantity, 0);
    return item.minStock > 0 && total < item.minStock;
  }).length;

  // Group movements by type for summary
  const movementSummary: Record<string, number> = {};
  thisMonthMovements.forEach((m) => {
    movementSummary[m.movementType] = (movementSummary[m.movementType] || 0) + 1;
  });

  // Requisitions by status
  const reqByStatus: Record<string, number> = {};
  requisitions.forEach((r) => {
    reqByStatus[r.status] = (reqByStatus[r.status] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">รายงานพัสดุ</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-500">รายการพัสดุ</p>
          <p className="text-3xl font-bold mt-1">{totalItems}</p>
          <p className="text-xs text-gray-400 mt-1">{totalCategories} หมวดหมู่</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-500">มูลค่าคงคลัง</p>
          <p className="text-2xl font-bold mt-1 text-blue-600">฿{formatCurrency(totalStockValue)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-500">เดือนนี้</p>
          <p className="text-lg font-bold mt-1 text-green-600">รับเข้า {receivedThisMonth}</p>
          <p className="text-lg font-bold text-red-600">เบิกจ่าย {disbursedThisMonth}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-500">พัสดุต่ำกว่าขั้นต่ำ</p>
          <p className={`text-3xl font-bold mt-1 ${lowStockCount > 0 ? "text-red-600" : "text-green-600"}`}>{lowStockCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">สรุปการเคลื่อนไหวเดือนนี้</h2>
          {Object.keys(movementSummary).length === 0 ? (
            <p className="text-gray-400 text-center py-4">ยังไม่มีกิจกรรม</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(movementSummary).map(([type, count]) => (
                <div key={type} className="flex justify-between py-2 border-b border-gray-50">
                  <span className="text-gray-600">{SUPPLY_MOVEMENT_LABELS[type] || type}</span>
                  <span className="font-medium">{count} รายการ</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">การเคลื่อนไหวล่าสุด</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {movements.slice(0, 10).map((m) => (
              <div key={m.id} className="flex justify-between py-2 border-b border-gray-50 text-sm">
                <div>
                  <span className="font-medium">{m.supplyItem.code}</span>
                  <span className="text-gray-500 ml-2">{m.supplyItem.nameTh}</span>
                </div>
                <div className="text-right">
                  <span className={`font-medium ${m.quantity > 0 ? "text-green-600" : "text-red-600"}`}>
                    {m.quantity > 0 ? "+" : ""}{m.quantity}
                  </span>
                  <p className="text-xs text-gray-400">{formatDate(m.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
