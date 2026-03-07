"use client";

import { useState, useEffect } from "react";
import { Plus, PackagePlus } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface SupplyItem { id: string; code: string; nameTh: string; unit: string; }
interface Supplier { id: string; nameTh: string; }
interface ReceiveItem { supplyItemId: string; quantity: number; unitCost: number; lotNumber: string; expiryDate: string; }
interface Receive {
  id: string; receiveNumber: string; receiveDate: string; invoiceNumber: string;
  totalAmount: number; status: string; notes: string;
  supplier?: { nameTh: string }; receivedBy?: { firstName: string; lastName: string };
  items: { supplyItemId: string; quantity: number; unitCost: number; totalCost: number }[];
}

export default function ReceivePage() {
  const [receives, setReceives] = useState<Receive[]>([]);
  const [items, setItems] = useState<SupplyItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [receiveItems, setReceiveItems] = useState<ReceiveItem[]>([{ supplyItemId: "", quantity: 1, unitCost: 0, lotNumber: "", expiryDate: "" }]);

  const fetchData = async () => {
    const [r, i, s] = await Promise.all([
      fetch("/api/supply/receive").then((r) => r.json()),
      fetch("/api/supply/items").then((r) => r.json()),
      fetch("/api/supply/suppliers").then((r) => r.json()),
    ]);
    setReceives(r); setItems(i); setSuppliers(s); setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const addRow = () => setReceiveItems([...receiveItems, { supplyItemId: "", quantity: 1, unitCost: 0, lotNumber: "", expiryDate: "" }]);
  const removeRow = (idx: number) => setReceiveItems(receiveItems.filter((_, i) => i !== idx));
  const updateRow = (idx: number, field: keyof ReceiveItem, value: string | number) => {
    const updated = [...receiveItems];
    updated[idx] = { ...updated[idx], [field]: value };
    setReceiveItems(updated);
  };

  const handleSave = async () => {
    const validItems = receiveItems.filter((i) => i.supplyItemId && i.quantity > 0);
    if (validItems.length === 0) return;
    setSaving(true);
    await fetch("/api/supply/receive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ supplierId: supplierId || null, invoiceNumber, notes, items: validItems }),
    });
    setSaving(false); setShowModal(false);
    setSupplierId(""); setInvoiceNumber(""); setNotes("");
    setReceiveItems([{ supplyItemId: "", quantity: 1, unitCost: 0, lotNumber: "", expiryDate: "" }]);
    fetchData();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PackagePlus className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">รับพัสดุ</h1>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700">
          <Plus className="w-4 h-4" /> รับพัสดุใหม่
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-gray-500">เลขที่ใบรับ</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">วันที่</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">ผู้จำหน่าย</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">เลขที่ใบส่งของ</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500">จำนวนรายการ</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500">มูลค่ารวม</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">ผู้รับ</th>
            </tr>
          </thead>
          <tbody>
            {receives.map((r) => (
              <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 font-mono text-xs font-medium">{r.receiveNumber}</td>
                <td className="py-3 px-4">{formatDate(r.receiveDate)}</td>
                <td className="py-3 px-4">{r.supplier?.nameTh || "-"}</td>
                <td className="py-3 px-4">{r.invoiceNumber || "-"}</td>
                <td className="py-3 px-4 text-right">{r.items.length}</td>
                <td className="py-3 px-4 text-right font-medium">{r.totalAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</td>
                <td className="py-3 px-4 text-gray-500">{r.receivedBy ? `${r.receivedBy.firstName} ${r.receivedBy.lastName}` : "-"}</td>
              </tr>
            ))}
            {receives.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-gray-400">ยังไม่มีรายการรับพัสดุ</td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">รับพัสดุใหม่</h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ผู้จำหน่าย</label>
                <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">ไม่ระบุ</option>
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.nameTh}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">เลขที่ใบส่งของ</label>
                <input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
                <input value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>

            <h3 className="font-medium text-sm mb-2">รายการพัสดุ</h3>
            <table className="w-full text-sm mb-4">
              <thead><tr className="border-b">
                <th className="text-left py-2 text-gray-500 font-medium">พัสดุ</th>
                <th className="text-right py-2 text-gray-500 font-medium w-20">จำนวน</th>
                <th className="text-right py-2 text-gray-500 font-medium w-24">ราคา/หน่วย</th>
                <th className="text-left py-2 text-gray-500 font-medium w-24">Lot</th>
                <th className="text-left py-2 text-gray-500 font-medium w-32">วันหมดอายุ</th>
                <th className="w-10"></th>
              </tr></thead>
              <tbody>
                {receiveItems.map((ri, idx) => (
                  <tr key={idx} className="border-b border-gray-100">
                    <td className="py-2 pr-2">
                      <select value={ri.supplyItemId} onChange={(e) => updateRow(idx, "supplyItemId", e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1 text-sm outline-none">
                        <option value="">เลือกพัสดุ</option>
                        {items.map((i) => <option key={i.id} value={i.id}>{i.code} - {i.nameTh} ({i.unit})</option>)}
                      </select>
                    </td>
                    <td className="py-2 px-1"><input type="number" min="1" value={ri.quantity} onChange={(e) => updateRow(idx, "quantity", parseInt(e.target.value) || 0)} className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-right outline-none" /></td>
                    <td className="py-2 px-1"><input type="number" min="0" step="0.01" value={ri.unitCost} onChange={(e) => updateRow(idx, "unitCost", parseFloat(e.target.value) || 0)} className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-right outline-none" /></td>
                    <td className="py-2 px-1"><input value={ri.lotNumber} onChange={(e) => updateRow(idx, "lotNumber", e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1 text-sm outline-none" /></td>
                    <td className="py-2 px-1"><input type="date" value={ri.expiryDate} onChange={(e) => updateRow(idx, "expiryDate", e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1 text-sm outline-none" /></td>
                    <td className="py-2">
                      {receiveItems.length > 1 && <button onClick={() => removeRow(idx)} className="text-red-500 hover:text-red-700 text-xs">ลบ</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={addRow} className="text-blue-600 text-sm hover:text-blue-800 mb-4">+ เพิ่มรายการ</button>

            <div className="flex justify-end gap-3 mt-4 border-t pt-4">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">ยกเลิก</button>
              <button onClick={handleSave} disabled={saving} className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 disabled:opacity-50">
                {saving ? "กำลังบันทึก..." : "บันทึกการรับพัสดุ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
