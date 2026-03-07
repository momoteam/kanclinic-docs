"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Boxes } from "lucide-react";

interface Category { id: string; code: string; nameTh: string; }
interface SupplyItem {
  id: string; code: string; nameTh: string; nameEn: string; unit: string;
  minStock: number; maxStock: number; price: number; description: string;
  categoryId: string; isActive: boolean;
  category?: { nameTh: string; code: string };
  stocks?: { quantity: number }[];
}

const EMPTY_FORM = { code: "", nameTh: "", nameEn: "", unit: "", minStock: "0", maxStock: "0", price: "0", description: "", categoryId: "" };

export default function SupplyItemsPage() {
  const [items, setItems] = useState<SupplyItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<SupplyItem | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");

  const fetchData = async () => {
    const [itemsRes, catsRes] = await Promise.all([
      fetch("/api/supply/items"),
      fetch("/api/supply/categories"),
    ]);
    setItems(await itemsRes.json());
    setCategories(await catsRes.json());
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openAdd = () => { setEditing(null); setForm({ ...EMPTY_FORM, categoryId: categories[0]?.id || "" }); setShowModal(true); };
  const openEdit = (item: SupplyItem) => {
    setEditing(item);
    setForm({
      code: item.code, nameTh: item.nameTh, nameEn: item.nameEn, unit: item.unit,
      minStock: String(item.minStock), maxStock: String(item.maxStock),
      price: String(item.price), description: item.description, categoryId: item.categoryId,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.nameTh.trim() || !form.categoryId) return;
    setSaving(true);
    await fetch("/api/supply/items", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing ? { ...form, id: editing.id } : form),
    });
    setSaving(false);
    setShowModal(false);
    fetchData();
  };

  const toggleActive = async (item: SupplyItem) => {
    await fetch("/api/supply/items", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, isActive: !item.isActive }),
    });
    fetchData();
  };

  const filtered = items.filter((i) => {
    const matchSearch = !search || i.nameTh.includes(search) || i.code.includes(search);
    const matchCat = !filterCat || i.categoryId === filterCat;
    return matchSearch && matchCat;
  });

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Boxes className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">รายการพัสดุ</h1>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700">
          <Plus className="w-4 h-4" /> เพิ่มพัสดุ
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex gap-3 flex-wrap">
        <input type="text" placeholder="ค้นหาพัสดุ..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-64 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
          <option value="">ทุกหมวดหมู่</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.nameTh}</option>)}
        </select>
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
              <th className="text-right py-3 px-4 font-medium text-gray-500">ราคา</th>
              <th className="text-center py-3 px-4 font-medium text-gray-500">สถานะ</th>
              <th className="text-center py-3 px-4 font-medium text-gray-500">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              const totalStock = item.stocks?.reduce((s, st) => s + st.quantity, 0) ?? 0;
              const isLow = item.minStock > 0 && totalStock < item.minStock;
              return (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-xs">{item.code || "-"}</td>
                  <td className="py-3 px-4 font-medium">{item.nameTh}</td>
                  <td className="py-3 px-4 text-gray-500">{item.category?.nameTh || "-"}</td>
                  <td className="py-3 px-4">{item.unit}</td>
                  <td className={`py-3 px-4 text-right font-medium ${isLow ? "text-red-600" : ""}`}>{totalStock}</td>
                  <td className="py-3 px-4 text-right text-gray-500">{item.minStock}</td>
                  <td className="py-3 px-4 text-right">{item.price.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</td>
                  <td className="py-3 px-4 text-center">
                    <button onClick={() => toggleActive(item)} className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {item.isActive ? "ใช้งาน" : "ปิด"}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button onClick={() => openEdit(item)} className="text-blue-600 hover:text-blue-800"><Pencil className="w-4 h-4" /></button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && <tr><td colSpan={9} className="text-center py-8 text-gray-400">ไม่พบข้อมูล</td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">{editing ? "แก้ไขพัสดุ" : "เพิ่มพัสดุใหม่"}</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">รหัส</label>
                  <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="เช่น CON-001" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">หมวดหมู่ <span className="text-red-500">*</span></label>
                  <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">เลือกหมวดหมู่</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.nameTh}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อพัสดุ (ไทย) <span className="text-red-500">*</span></label>
                <input value={form.nameTh} onChange={(e) => setForm({ ...form, nameTh: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อพัสดุ (อังกฤษ)</label>
                <input value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">หน่วยนับ</label>
                  <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="เช่น รีม, กล่อง, อัน" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ราคาต่อหน่วย</label>
                  <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">สต็อกขั้นต่ำ</label>
                  <input type="number" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">สต็อกสูงสุด</label>
                  <input type="number" value={form.maxStock} onChange={(e) => setForm({ ...form, maxStock: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียด</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">ยกเลิก</button>
              <button onClick={handleSave} disabled={saving || !form.nameTh.trim() || !form.categoryId} className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 disabled:opacity-50">
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
