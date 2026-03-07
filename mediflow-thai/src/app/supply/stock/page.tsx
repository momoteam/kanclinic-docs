"use client";

import { useState, useEffect } from "react";
import { Warehouse } from "lucide-react";

interface StockItem {
  id: string; code: string; nameTh: string; unit: string; minStock: number; maxStock: number;
  category: { nameTh: string; code: string };
  stocks: { id: string; lotNumber: string; quantity: number; unitCost: number; receivedDate: string; expiryDate: string | null; location: string }[];
  totalStock: number; totalValue: number;
}

export default function StockPage() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");

  useEffect(() => {
    fetch("/api/supply/stock").then((r) => r.json()).then((d) => { setItems(d); setLoading(false); });
  }, []);

  const filtered = items.filter((i) => {
    const matchSearch = !search || i.nameTh.includes(search) || i.code.includes(search);
    if (filter === "low") return matchSearch && i.minStock > 0 && i.totalStock < i.minStock && i.totalStock > 0;
    if (filter === "out") return matchSearch && i.totalStock === 0;
    return matchSearch;
  });

  const totalValue = items.reduce((sum, i) => sum + i.totalValue, 0);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Warehouse className="w-6 h-6 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">สต็อกคงเหลือ</h1>
          <p className="text-sm text-gray-500">มูลค่าคงคลังรวม: ฿{totalValue.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex gap-3 flex-wrap">
        <input type="text" placeholder="ค้นหา..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-64 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        <div className="flex gap-2">
          {(["all", "low", "out"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm ${filter === f ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
              {{ all: "ทั้งหมด", low: "ต่ำกว่าขั้นต่ำ", out: "หมด" }[f]}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-gray-500">รหัส</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">ชื่อพัสดุ</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">หมวดหมู่</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">หน่วย</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500">คงเหลือ</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500">ขั้นต่ำ</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500">มูลค่า</th>
              <th className="text-center py-3 px-4 font-medium text-gray-500">สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              const isLow = item.minStock > 0 && item.totalStock < item.minStock;
              const isOut = item.totalStock === 0;
              return (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-xs">{item.code}</td>
                  <td className="py-3 px-4 font-medium">{item.nameTh}</td>
                  <td className="py-3 px-4 text-gray-500">{item.category?.nameTh}</td>
                  <td className="py-3 px-4">{item.unit}</td>
                  <td className={`py-3 px-4 text-right font-medium ${isLow || isOut ? "text-red-600" : ""}`}>{item.totalStock}</td>
                  <td className="py-3 px-4 text-right text-gray-500">{item.minStock}</td>
                  <td className="py-3 px-4 text-right">{item.totalValue.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</td>
                  <td className="py-3 px-4 text-center">
                    {isOut ? <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">หมด</span>
                      : isLow ? <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">ต่ำ</span>
                      : <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">ปกติ</span>}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && <tr><td colSpan={8} className="text-center py-8 text-gray-400">ไม่พบข้อมูล</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
