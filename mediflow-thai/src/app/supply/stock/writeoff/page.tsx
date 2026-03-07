"use client";

import { useState, useEffect } from "react";
import { Trash2, Plus } from "lucide-react";
import { generateWriteOffNumber } from "@/lib/utils";

interface StockItem {
  id: string; code: string; nameTh: string; unit: string;
  stocks: { id: string; lotNumber: string; quantity: number; unitCost: number }[];
  totalStock: number;
}

interface WriteOffItem { supplyItemId: string; stockId: string; quantity: number; unitCost: number; condition: string; notes: string; }

const REASONS = ["ชำรุดเสียหาย", "เสื่อมสภาพ", "สูญหาย", "หมดอายุ", "ล้าสมัย", "อื่นๆ"];

export default function WriteOffPage() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [notes, setNotes] = useState("");
  const [writeOffItems, setWriteOffItems] = useState<WriteOffItem[]>([]);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch("/api/supply/stock").then((r) => r.json()).then((d) => { setItems(d); setLoading(false); });
  }, []);

  const addItem = () => setWriteOffItems([...writeOffItems, { supplyItemId: "", stockId: "", quantity: 1, unitCost: 0, condition: "", notes: "" }]);
  const removeItem = (idx: number) => setWriteOffItems(writeOffItems.filter((_, i) => i !== idx));

  const updateItem = (idx: number, field: keyof WriteOffItem, value: string | number) => {
    const updated = [...writeOffItems];
    updated[idx] = { ...updated[idx], [field]: value };
    if (field === "supplyItemId") {
      updated[idx].stockId = "";
      updated[idx].unitCost = 0;
    }
    if (field === "stockId") {
      const item = items.find((i) => i.id === updated[idx].supplyItemId);
      const stock = item?.stocks.find((s) => s.id === value);
      if (stock) updated[idx].unitCost = stock.unitCost;
    }
    setWriteOffItems(updated);
  };

  const handleSubmit = async () => {
    const valid = writeOffItems.filter((i) => i.supplyItemId && i.stockId && i.quantity > 0);
    if (valid.length === 0) return;
    setSaving(true);
    await fetch("/api/supply/stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "writeoff", writeOffNumber: generateWriteOffNumber(), reason, notes, items: valid }),
    });
    setSaving(false);
    setShowForm(false);
    setWriteOffItems([]);
    setReason(REASONS[0]);
    setNotes("");
    setSuccess("บันทึกการตัดจำหน่ายเรียบร้อย");
    const res = await fetch("/api/supply/stock");
    setItems(await res.json());
    setTimeout(() => setSuccess(""), 3000);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Trash2 className="w-6 h-6 text-red-600" />
          <h1 className="text-2xl font-bold text-gray-900">ตัดจำหน่ายพัสดุ</h1>
        </div>
        {!showForm && (
          <button onClick={() => { setShowForm(true); addItem(); }} className="flex items-center gap-2 bg-red-600 text-white rounded-lg px-4 py-2 hover:bg-red-700">
            <Plus className="w-4 h-4" /> ตัดจำหน่าย
          </button>
        )}
      </div>

      {success && <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm">{success}</div>}

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">สาเหตุ</label>
              <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
              <input value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>

          <table className="w-full text-sm">
            <thead><tr className="border-b">
              <th className="text-left py-2 text-gray-500 font-medium">พัสดุ</th>
              <th className="text-left py-2 text-gray-500 font-medium w-32">Lot</th>
              <th className="text-right py-2 text-gray-500 font-medium w-20">จำนวน</th>
              <th className="text-left py-2 text-gray-500 font-medium w-32">สภาพ</th>
              <th className="w-10"></th>
            </tr></thead>
            <tbody>
              {writeOffItems.map((wi, idx) => {
                const item = items.find((i) => i.id === wi.supplyItemId);
                return (
                  <tr key={idx} className="border-b border-gray-100">
                    <td className="py-2 pr-2">
                      <select value={wi.supplyItemId} onChange={(e) => updateItem(idx, "supplyItemId", e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1 text-sm outline-none">
                        <option value="">เลือกพัสดุ</option>
                        {items.filter((i) => i.totalStock > 0).map((i) => (
                          <option key={i.id} value={i.id}>{i.code} - {i.nameTh}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 px-1">
                      <select value={wi.stockId} onChange={(e) => updateItem(idx, "stockId", e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1 text-sm outline-none">
                        <option value="">เลือก Lot</option>
                        {item?.stocks.filter((s) => s.quantity > 0).map((s) => (
                          <option key={s.id} value={s.id}>{s.lotNumber || "ไม่ระบุ"} ({s.quantity})</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 px-1"><input type="number" min="1" value={wi.quantity} onChange={(e) => updateItem(idx, "quantity", parseInt(e.target.value) || 0)} className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-right outline-none" /></td>
                    <td className="py-2 px-1"><input value={wi.condition} onChange={(e) => updateItem(idx, "condition", e.target.value)} placeholder="สภาพพัสดุ" className="w-full border border-gray-300 rounded px-2 py-1 text-sm outline-none" /></td>
                    <td className="py-2">{writeOffItems.length > 1 && <button onClick={() => removeItem(idx)} className="text-red-500 text-xs">ลบ</button>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <button onClick={addItem} className="text-blue-600 text-sm hover:text-blue-800">+ เพิ่มรายการ</button>

          <div className="flex justify-end gap-3 border-t pt-4">
            <button onClick={() => { setShowForm(false); setWriteOffItems([]); }} className="px-4 py-2 text-gray-600">ยกเลิก</button>
            <button onClick={handleSubmit} disabled={saving} className="bg-red-600 text-white rounded-lg px-6 py-2 hover:bg-red-700 disabled:opacity-50">
              {saving ? "กำลังบันทึก..." : "ยืนยันตัดจำหน่าย"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
