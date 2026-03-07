"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, FolderTree } from "lucide-react";

interface Category {
  id: string;
  code: string;
  nameTh: string;
  nameEn: string;
  description: string;
  isActive: boolean;
  _count?: { items: number };
}

const EMPTY_FORM = { code: "", nameTh: "", nameEn: "", description: "" };

export default function SupplyCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    const res = await fetch("/api/supply/categories");
    setCategories(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (c: Category) => {
    setEditing(c);
    setForm({ code: c.code, nameTh: c.nameTh, nameEn: c.nameEn, description: c.description });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.nameTh.trim()) return;
    setSaving(true);
    await fetch("/api/supply/categories", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing ? { ...form, id: editing.id } : form),
    });
    setSaving(false);
    setShowModal(false);
    fetchData();
  };

  const toggleActive = async (c: Category) => {
    await fetch("/api/supply/categories", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: c.id, isActive: !c.isActive }),
    });
    fetchData();
  };

  const filtered = categories.filter((c) =>
    c.nameTh.includes(search) || c.code.includes(search)
  );

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FolderTree className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">หมวดหมู่พัสดุ</h1>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700">
          <Plus className="w-4 h-4" /> เพิ่มหมวดหมู่
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <input
          type="text"
          placeholder="ค้นหาหมวดหมู่..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-64 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-gray-500">รหัส</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">ชื่อหมวดหมู่</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">รายละเอียด</th>
              <th className="text-center py-3 px-4 font-medium text-gray-500">จำนวนพัสดุ</th>
              <th className="text-center py-3 px-4 font-medium text-gray-500">สถานะ</th>
              <th className="text-center py-3 px-4 font-medium text-gray-500">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 font-mono text-xs">{c.code || "-"}</td>
                <td className="py-3 px-4 font-medium">{c.nameTh}</td>
                <td className="py-3 px-4 text-gray-500">{c.description || "-"}</td>
                <td className="py-3 px-4 text-center">{c._count?.items ?? 0}</td>
                <td className="py-3 px-4 text-center">
                  <button onClick={() => toggleActive(c)} className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {c.isActive ? "ใช้งาน" : "ปิด"}
                  </button>
                </td>
                <td className="py-3 px-4 text-center">
                  <button onClick={() => openEdit(c)} className="text-blue-600 hover:text-blue-800">
                    <Pencil className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">ไม่พบข้อมูล</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
            <h2 className="text-lg font-bold mb-4">{editing ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่ใหม่"}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">รหัส</label>
                <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="เช่น OFC, CLN, COM" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อหมวดหมู่ (ไทย) <span className="text-red-500">*</span></label>
                <input value={form.nameTh} onChange={(e) => setForm({ ...form, nameTh: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อหมวดหมู่ (อังกฤษ)</label>
                <input value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียด</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">ยกเลิก</button>
              <button onClick={handleSave} disabled={saving || !form.nameTh.trim()} className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 disabled:opacity-50">
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
