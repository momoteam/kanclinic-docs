"use client";

import { useState, useEffect } from "react";
import { SlidersHorizontal } from "lucide-react";

interface StockItem {
  id: string; code: string; nameTh: string; unit: string;
  stocks: { id: string; lotNumber: string; quantity: number; unitCost: number }[];
  totalStock: number;
}

export default function StockAdjustPage() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [selectedStockId, setSelectedStockId] = useState("");
  const [newQuantity, setNewQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch("/api/supply/stock").then((r) => r.json()).then((d) => { setItems(d); setLoading(false); });
  }, []);

  const selectedItem = items.find((i) => i.id === selectedItemId);
  const selectedStock = selectedItem?.stocks.find((s) => s.id === selectedStockId);

  const handleAdjust = async () => {
    if (!selectedStockId || !reason.trim()) return;
    setSaving(true);
    await fetch("/api/supply/stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "adjust", stockId: selectedStockId, newQuantity, reason }),
    });
    setSaving(false);
    setSuccess("ปรับปรุงสต็อกเรียบร้อย");
    setSelectedItemId(""); setSelectedStockId(""); setNewQuantity(""); setReason("");
    const res = await fetch("/api/supply/stock");
    setItems(await res.json());
    setTimeout(() => setSuccess(""), 3000);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

  const diff = selectedStock && newQuantity ? parseInt(newQuantity) - selectedStock.quantity : 0;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <SlidersHorizontal className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">ปรับปรุงสต็อก</h1>
      </div>

      {success && <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm">{success}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <p className="text-sm text-gray-500">แก้ไขจำนวนคงเหลือให้ตรงกับพัสดุจริงในคลัง</p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">เลือกพัสดุ <span className="text-red-500">*</span></label>
          <select value={selectedItemId} onChange={(e) => { setSelectedItemId(e.target.value); setSelectedStockId(""); setNewQuantity(""); }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">เลือกพัสดุ</option>
            {items.filter((i) => i.stocks.length > 0).map((i) => (
              <option key={i.id} value={i.id}>{i.code} - {i.nameTh} (คงเหลือ: {i.totalStock} {i.unit})</option>
            ))}
          </select>
        </div>

        {selectedItem && selectedItem.stocks.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">เลือก Lot</label>
            <select value={selectedStockId} onChange={(e) => { setSelectedStockId(e.target.value); const s = selectedItem.stocks.find((s) => s.id === e.target.value); if (s) setNewQuantity(String(s.quantity)); }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">เลือก Lot</option>
              {selectedItem.stocks.map((s) => (
                <option key={s.id} value={s.id}>Lot: {s.lotNumber || "ไม่ระบุ"} | คงเหลือ: {s.quantity}</option>
              ))}
            </select>
          </div>
        )}

        {selectedStock && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนปัจจุบัน</label>
                <input value={selectedStock.quantity} readOnly className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนใหม่ <span className="text-red-500">*</span></label>
                <input type="number" min="0" value={newQuantity} onChange={(e) => setNewQuantity(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
            {diff !== 0 && (
              <div className={`text-sm font-medium ${diff > 0 ? "text-green-600" : "text-red-600"}`}>
                ผลต่าง: {diff > 0 ? "+" : ""}{diff} {selectedItem?.unit}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">เหตุผล <span className="text-red-500">*</span></label>
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="ระบุเหตุผลในการปรับปรุง" />
            </div>
            <button onClick={handleAdjust} disabled={saving || !reason.trim() || !newQuantity}
              className="bg-blue-600 text-white rounded-lg px-6 py-2 hover:bg-blue-700 disabled:opacity-50 w-full">
              {saving ? "กำลังบันทึก..." : "ปรับปรุงสต็อก"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
