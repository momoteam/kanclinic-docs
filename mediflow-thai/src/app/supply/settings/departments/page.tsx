"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Building2 } from "lucide-react";

interface User { id: string; firstName: string; lastName: string; }
interface Department {
  id: string; code: string; nameTh: string; nameEn: string;
  headUserId: string | null; isActive: boolean;
  headUser?: { firstName: string; lastName: string } | null;
  _count?: { requisitions: number };
}

const EMPTY_FORM = { code: "", nameTh: "", nameEn: "", headUserId: "" };

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    const [dRes, uRes] = await Promise.all([
      fetch("/api/supply/departments"),
      fetch("/api/settings/users"),
    ]);
    setDepartments(await dRes.json());
    const usersData = await uRes.json();
    setUsers(Array.isArray(usersData) ? usersData : []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (d: Department) => {
    setEditing(d);
    setForm({ code: d.code, nameTh: d.nameTh, nameEn: d.nameEn, headUserId: d.headUserId || "" });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.nameTh.trim()) return;
    setSaving(true);
    await fetch("/api/supply/departments", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing ? { ...form, id: editing.id, headUserId: form.headUserId || null } : { ...form, headUserId: form.headUserId || null }),
    });
    setSaving(false); setShowModal(false); fetchData();
  };

  const toggleActive = async (d: Department) => {
    await fetch("/api/supply/departments", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: d.id, isActive: !d.isActive }),
    });
    fetchData();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">หน่วยงาน</h1>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700">
          <Plus className="w-4 h-4" /> เพิ่มหน่วยงาน
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-gray-500">รหัส</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">ชื่อหน่วยงาน</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">หัวหน้า</th>
              <th className="text-center py-3 px-4 font-medium text-gray-500">ใบเบิก</th>
              <th className="text-center py-3 px-4 font-medium text-gray-500">สถานะ</th>
              <th className="text-center py-3 px-4 font-medium text-gray-500">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {departments.map((d) => (
              <tr key={d.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 font-mono text-xs">{d.code || "-"}</td>
                <td className="py-3 px-4 font-medium">{d.nameTh}</td>
                <td className="py-3 px-4 text-gray-500">{d.headUser ? `${d.headUser.firstName} ${d.headUser.lastName}` : "-"}</td>
                <td className="py-3 px-4 text-center">{d._count?.requisitions ?? 0}</td>
                <td className="py-3 px-4 text-center">
                  <button onClick={() => toggleActive(d)} className={`px-2 py-0.5 rounded-full text-xs font-medium ${d.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {d.isActive ? "ใช้งาน" : "ปิด"}
                  </button>
                </td>
                <td className="py-3 px-4 text-center">
                  <button onClick={() => openEdit(d)} className="text-blue-600 hover:text-blue-800"><Pencil className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
            {departments.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-gray-400">ยังไม่มีหน่วยงาน</td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
            <h2 className="text-lg font-bold mb-4">{editing ? "แก้ไขหน่วยงาน" : "เพิ่มหน่วยงานใหม่"}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">รหัส</label>
                <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อหน่วยงาน (ไทย) <span className="text-red-500">*</span></label>
                <input value={form.nameTh} onChange={(e) => setForm({ ...form, nameTh: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อหน่วยงาน (อังกฤษ)</label>
                <input value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">หัวหน้าหน่วยงาน</label>
                <select value={form.headUserId} onChange={(e) => setForm({ ...form, headUserId: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">ไม่ระบุ</option>
                  {users.map((u) => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
                </select>
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
