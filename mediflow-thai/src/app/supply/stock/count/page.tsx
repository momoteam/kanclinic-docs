"use client";

import { useState, useEffect } from "react";
import { ClipboardCheck } from "lucide-react";
import { generateCountNumber } from "@/lib/utils";

interface StockItem {
  id: string; code: string; nameTh: string; unit: string; totalStock: number;
}

interface CountItem { supplyItemId: string; systemQty: number; actualQty: number; notes: string; }

export default function InventoryCountPage() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [countItems, setCountItems] = useState<CountItem[]>([]);

  useEffect(() => {
    fetch("/api/supply/stock").then((r) => r.json()).then((d) => { setItems(d); setLoading(false); });
  }, []);

  const startCount = () => {
    setCountItems(items.map((i) => ({ supplyItemId: i.id, systemQty: i.totalStock, actualQty: i.totalStock, notes: "" })));
    setShowForm(true);
  };

  const updateCount = (idx: number, field: keyof CountItem, value: string | number) => {
    const updated = [...countItems];
    updated[idx] = { ...updated[idx], [field]: value };
    setCountItems(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    const now = new Date();
    const fiscalYear = now.getFullYear() + 543;

    // For items with differences, adjust stock
    for (const ci of countItems) {
      if (ci.actualQty !== ci.systemQty) {
        const item = items.find((i) => i.id === ci.supplyItemId);
        if (!item) continue;
        // Get the first stock for this item to adjust
        const stockRes = await fetch("/api/supply/stock");
        const allStocks = await stockRes.json();
        const stockItem = allStocks.find((s: StockItem & { stocks: { id: string; quantity: number }[] }) => s.id === ci.supplyItemId);
        if (stockItem?.stocks?.[0]) {
          const stock = stockItem.stocks[0];
          const newQty = Math.max(0, stock.quantity + (ci.actualQty - ci.systemQty));
          await fetch("/api/supply/stock", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "adjust",
              stockId: stock.id,
              newQuantity: newQty,
              reason: `ตรวจนับประจำปี ${fiscalYear} (${generateCountNumber()})`,
            }),
          });
        }
      }
    }

    setSaving(false);
    setShowForm(false);
    setSuccess("บันทึกผลการตรวจนับเรียบร้อย");
    const res = await fetch("/api/supply/stock");
    setItems(await res.json());
    setTimeout(() => setSuccess(""), 3000);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClipboardCheck className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">ตรวจนับประจำปี</h1>
        </div>
        {!showForm && (
          <button onClick={startCount} className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700">
            เริ่มตรวจนับ
          </button>
        )}
      </div>

      {success && <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm">{success}</div>}

      {showForm ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-4">กรอกจำนวนจริงที่ตรวจนับได้</p>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="border-b">
                <th className="text-left py-2 px-3 text-gray-500 font-medium">รหัส</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">ชื่อพัสดุ</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">หน่วย</th>
                <th className="text-right py-2 px-3 text-gray-500 font-medium">ในระบบ</th>
                <th className="text-right py-2 px-3 text-gray-500 font-medium w-24">จำนวนจริง</th>
                <th className="text-right py-2 px-3 text-gray-500 font-medium">ผลต่าง</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium w-32">หมายเหตุ</th>
              </tr>
            </thead>
            <tbody>
              {countItems.map((ci, idx) => {
                const item = items.find((i) => i.id === ci.supplyItemId);
                const diff = ci.actualQty - ci.systemQty;
                return (
                  <tr key={ci.supplyItemId} className="border-b border-gray-100">
                    <td className="py-2 px-3 font-mono text-xs">{item?.code}</td>
                    <td className="py-2 px-3">{item?.nameTh}</td>
                    <td className="py-2 px-3 text-gray-500">{item?.unit}</td>
                    <td className="py-2 px-3 text-right">{ci.systemQty}</td>
                    <td className="py-2 px-3">
                      <input type="number" min="0" value={ci.actualQty} onChange={(e) => updateCount(idx, "actualQty", parseInt(e.target.value) || 0)}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-right outline-none" />
                    </td>
                    <td className={`py-2 px-3 text-right font-medium ${diff > 0 ? "text-green-600" : diff < 0 ? "text-red-600" : ""}`}>
                      {diff !== 0 ? (diff > 0 ? `+${diff}` : diff) : "-"}
                    </td>
                    <td className="py-2 px-3">
                      <input value={ci.notes} onChange={(e) => updateCount(idx, "notes", e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm outline-none" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="flex justify-end gap-3 mt-4 border-t pt-4">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600">ยกเลิก</button>
            <button onClick={handleSave} disabled={saving} className="bg-blue-600 text-white rounded-lg px-6 py-2 hover:bg-blue-700 disabled:opacity-50">
              {saving ? "กำลังบันทึก..." : "บันทึกผลตรวจนับ"}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-400">
          กดปุ่ม &quot;เริ่มตรวจนับ&quot; เพื่อเริ่มการตรวจนับพัสดุประจำปี
        </div>
      )}
    </div>
  );
}
