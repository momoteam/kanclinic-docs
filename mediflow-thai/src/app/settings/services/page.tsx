"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Stethoscope,
  Plus,
  X,
  Loader2,
  Search,
  Edit2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

interface ServiceData {
  id: string;
  code: string;
  nameTh: string;
  nameEn: string;
  category: string;
  price: number;
  durationMinutes: number;
  description: string;
  isActive: boolean;
}

const CATEGORIES = [
  { value: "General", label: "ทั่วไป" },
  { value: "Specialist", label: "เฉพาะทาง" },
  { value: "Procedure", label: "หัตถการ" },
  { value: "Lab", label: "ตรวจแล็บ" },
  { value: "Vaccine", label: "วัคซีน" },
  { value: "Other", label: "อื่นๆ" },
];

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.label])
);

const CATEGORY_COLORS: Record<string, string> = {
  General: "bg-blue-100 text-blue-700",
  Specialist: "bg-purple-100 text-purple-700",
  Procedure: "bg-orange-100 text-orange-700",
  Lab: "bg-cyan-100 text-cyan-700",
  Vaccine: "bg-green-100 text-green-700",
  Other: "bg-gray-100 text-gray-700",
};

const EMPTY_FORM = {
  code: "",
  nameTh: "",
  nameEn: "",
  category: "General",
  price: "",
  durationMinutes: "15",
  description: "",
};

export default function ServicesSettingsPage() {
  const [services, setServices] = useState<ServiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<ServiceData | null>(
    null
  );
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchServices = async () => {
    try {
      const res = await fetch("/api/settings/services");
      const data = await res.json();
      setServices(data);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const openAdd = () => {
    setEditingService(null);
    setForm(EMPTY_FORM);
    setError("");
    setShowModal(true);
  };

  const openEdit = (svc: ServiceData) => {
    setEditingService(svc);
    setForm({
      code: svc.code,
      nameTh: svc.nameTh,
      nameEn: svc.nameEn,
      category: svc.category,
      price: String(svc.price),
      durationMinutes: String(svc.durationMinutes),
      description: svc.description,
    });
    setError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.nameTh) {
      setError("กรุณากรอกชื่อบริการ");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const method = editingService ? "PUT" : "POST";
      const payload = editingService
        ? { id: editingService.id, ...form }
        : form;
      const res = await fetch("/api/settings/services", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "เกิดข้อผิดพลาด");
        return;
      }

      setShowModal(false);
      fetchServices();
    } catch {
      setError("ไม่สามารถบันทึกข้อมูลได้");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (svc: ServiceData) => {
    try {
      await fetch("/api/settings/services", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: svc.id, isActive: !svc.isActive }),
      });
      fetchServices();
    } catch {
      // handle error
    }
  };

  const filteredServices = services.filter((s) => {
    if (filterCategory && s.category !== filterCategory) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.code.toLowerCase().includes(q) ||
      s.nameTh.toLowerCase().includes(q) ||
      s.nameEn.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/settings"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-green-600" />
            <h1 className="text-2xl font-bold text-gray-900">จัดการบริการ</h1>
          </div>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          เพิ่มบริการ
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหารหัส หรือชื่อบริการ..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="">ทุกหมวดหมู่</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="pb-3 font-medium">รหัส</th>
                  <th className="pb-3 font-medium">ชื่อบริการ</th>
                  <th className="pb-3 font-medium">หมวดหมู่</th>
                  <th className="pb-3 font-medium text-right">ราคา</th>
                  <th className="pb-3 font-medium text-right">เวลา (นาที)</th>
                  <th className="pb-3 font-medium">สถานะ</th>
                  <th className="pb-3 font-medium text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredServices.map((svc) => (
                  <tr
                    key={svc.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 text-gray-500 font-mono text-xs">
                      {svc.code || "-"}
                    </td>
                    <td className="py-3">
                      <div className="font-medium text-gray-900">
                        {svc.nameTh}
                      </div>
                      {svc.nameEn && (
                        <div className="text-xs text-gray-400">
                          {svc.nameEn}
                        </div>
                      )}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${CATEGORY_COLORS[svc.category] || "bg-gray-100"}`}
                      >
                        {CATEGORY_LABELS[svc.category] || svc.category}
                      </span>
                    </td>
                    <td className="py-3 text-right font-medium">
                      {svc.price.toLocaleString("th-TH", {
                        minimumFractionDigits: 0,
                      })}{" "}
                      บาท
                    </td>
                    <td className="py-3 text-right text-gray-500">
                      {svc.durationMinutes}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${svc.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                      >
                        {svc.isActive ? "เปิด" : "ปิด"}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(svc)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                          title="แก้ไข"
                        >
                          <Edit2 className="w-4 h-4 text-gray-500" />
                        </button>
                        <button
                          onClick={() => toggleActive(svc)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                          title={svc.isActive ? "ปิดบริการ" : "เปิดบริการ"}
                        >
                          {svc.isActive ? (
                            <ToggleRight className="w-4 h-4 text-green-600" />
                          ) : (
                            <ToggleLeft className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredServices.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-center py-10 text-gray-400"
                    >
                      {search || filterCategory
                        ? "ไม่พบบริการที่ตรงกัน"
                        : "ยังไม่มีบริการในระบบ"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingService ? "แก้ไขบริการ" : "เพิ่มบริการใหม่"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    รหัสบริการ
                  </label>
                  <input
                    value={form.code}
                    onChange={(e) =>
                      setForm({ ...form, code: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="SVC001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    หมวดหมู่
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อบริการ (ไทย) <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.nameTh}
                  onChange={(e) =>
                    setForm({ ...form, nameTh: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="ชื่อบริการภาษาไทย"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อบริการ (อังกฤษ)
                </label>
                <input
                  value={form.nameEn}
                  onChange={(e) =>
                    setForm({ ...form, nameEn: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Service name in English"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ราคา (บาท)
                  </label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ระยะเวลา (นาที)
                  </label>
                  <input
                    type="number"
                    value={form.durationMinutes}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        durationMinutes: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="15"
                    min="1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  รายละเอียด
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                  placeholder="รายละเอียดเพิ่มเติม"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingService ? "บันทึก" : "เพิ่มบริการ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
