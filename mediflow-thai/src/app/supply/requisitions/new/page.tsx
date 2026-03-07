"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface SupplyItem { id: string; code: string; nameTh: string; unit: string; }
interface Department { id: string; nameTh: string; }
interface ReqItem { supplyItemId: string; requestedQty: number; notes: string; }

export default function NewRequisitionPage() {
  const router = useRouter();
  const [items, setItems] = useState<SupplyItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [departmentId, setDepartmentId] = useState("");
  const [purpose, setPurpose] = useState("");
  const [notes, setNotes] = useState("");
  const [reqItems, setReqItems] = useState<ReqItem[]>([{ supplyItemId: "", requestedQty: 1, notes: "" }]);

  useEffect(() => {
    Promise.all([
      fetch("/api/supply/items").then((r) => r.json()),
      fetch("/api/supply/departments").then((r) => r.json()),
    ]).then(([i, d]) => { setItems(i); setDepartments(d); setDepartmentId(d[0]?.id || ""); setLoading(false); });
  }, []);

  const addRow = () => setReqItems([...reqItems, { supplyItemId: "", requestedQty: 1, notes: "" }]);
  const removeRow = (idx: number) => setReqItems(reqItems.filter((_, i) => i !== idx));
  const updateRow = (idx: number, field: keyof ReqItem, value: string | number) => {
    const updated = [...reqItems];
    updated[idx] = { ...updated[idx], [field]: value };
    setReqItems(updated);
  };

  const handleSubmit = async () => {
    if (!departmentId) return;
    const validItems = reqItems.filter((i) => i.supplyItemId && i.requestedQty > 0);
    if (validItems.length === 0) return;
    setSaving(true);
    await fetch("/api/supply/requisitions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ departmentId, purpose, notes, items: validItems }),
    });
    router.push("/supply/requisitions");
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-2xl font-bold text-gray-900">สร้างใบเบิกพัสดุ</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">หน่วยงาน <span className="text-red-500">*</span></label>
            <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">เลือกหน่วยงาน</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.nameTh}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">วัตถุประสงค์</label>
            <input value={purpose} onChange={(e) => setPurpose(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>

        <h3 className="font-medium text-sm pt-2">รายการพัสดุที่เบิก</h3>
        <table className="w-full text-sm">
          <thead><tr className="border-b">
            <th className="text-left py-2 text-gray-500 font-medium">พัสดุ</th>
            <th className="text-right py-2 text-gray-500 font-medium w-24">จำนวน</th>
            <th className="text-left py-2 text-gray-500 font-medium w-40">หมายเหตุ</th>
            <th className="w-10"></th>
          </tr></thead>
          <tbody>
            {reqItems.map((ri, idx) => (
              <tr key={idx} className="border-b border-gray-100">
                <td className="py-2 pr-2">
                  <select value={ri.supplyItemId} onChange={(e) => updateRow(idx, "supplyItemId", e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1 text-sm outline-none">
                    <option value="">เลือกพัสดุ</option>
                    {items.map((i) => <option key={i.id} value={i.id}>{i.code} - {i.nameTh} ({i.unit})</option>)}
                  </select>
                </td>
                <td className="py-2 px-1"><input type="number" min="1" value={ri.requestedQty} onChange={(e) => updateRow(idx, "requestedQty", parseInt(e.target.value) || 0)} className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-right outline-none" /></td>
                <td className="py-2 px-1"><input value={ri.notes} onChange={(e) => updateRow(idx, "notes", e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1 text-sm outline-none" /></td>
                <td className="py-2">{reqItems.length > 1 && <button onClick={() => removeRow(idx)} className="text-red-500 hover:text-red-700 text-xs">ลบ</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <button onClick={addRow} className="text-blue-600 text-sm hover:text-blue-800">+ เพิ่มรายการ</button>
      </div>

      <div className="flex justify-end gap-3">
        <button onClick={() => router.back()} className="px-4 py-2 text-gray-600 hover:text-gray-800">ยกเลิก</button>
        <button onClick={handleSubmit} disabled={saving || !departmentId} className="bg-blue-600 text-white rounded-lg px-6 py-2 hover:bg-blue-700 disabled:opacity-50">
          {saving ? "กำลังบันทึก..." : "ส่งใบเบิก"}
        </button>
      </div>
    </div>
  );
}
