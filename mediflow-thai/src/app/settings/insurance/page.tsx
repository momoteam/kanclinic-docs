"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  Plus,
  X,
  Loader2,
  Search,
  Edit2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

interface InsurancePlanData {
  id: string;
  name: string;
  type: string;
  discountPercent: number;
  coverageLimit: number;
  description: string;
  isActive: boolean;
}

const PLAN_TYPES = [
  { value: "UC", label: "บัตรทอง (UC)" },
  { value: "SocialSecurity", label: "ประกันสังคม" },
  { value: "Government", label: "ข้าราชการ" },
  { value: "PrivateInsurance", label: "ประกันเอกชน" },
  { value: "SelfPay", label: "ชำระเอง" },
];

const TYPE_LABELS: Record<string, string> = Object.fromEntries(
  PLAN_TYPES.map((t) => [t.value, t.label])
);

const TYPE_COLORS: Record<string, string> = {
  UC: "bg-yellow-100 text-yellow-700",
  SocialSecurity: "bg-blue-100 text-blue-700",
  Government: "bg-red-100 text-red-700",
  PrivateInsurance: "bg-purple-100 text-purple-700",
  SelfPay: "bg-gray-100 text-gray-700",
};

const EMPTY_FORM = {
  name: "",
  type: "SelfPay",
  discountPercent: "",
  coverageLimit: "",
  description: "",
};

export default function InsuranceSettingsPage() {
  const [plans, setPlans] = useState<InsurancePlanData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<InsurancePlanData | null>(
    null
  );
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchPlans = async () => {
    try {
      const res = await fetch("/api/settings/insurance");
      const data = await res.json();
      setPlans(data);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const openAdd = () => {
    setEditingPlan(null);
    setForm(EMPTY_FORM);
    setError("");
    setShowModal(true);
  };

  const openEdit = (plan: InsurancePlanData) => {
    setEditingPlan(plan);
    setForm({
      name: plan.name,
      type: plan.type,
      discountPercent: String(plan.discountPercent),
      coverageLimit: String(plan.coverageLimit),
      description: plan.description,
    });
    setError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name) {
      setError("กรุณากรอกชื่อสิทธิ");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const method = editingPlan ? "PUT" : "POST";
      const payload = editingPlan ? { id: editingPlan.id, ...form } : form;
      const res = await fetch("/api/settings/insurance", {
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
      fetchPlans();
    } catch {
      setError("ไม่สามารถบันทึกข้อมูลได้");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (plan: InsurancePlanData) => {
    try {
      await fetch("/api/settings/insurance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: plan.id, isActive: !plan.isActive }),
      });
      fetchPlans();
    } catch {
      // handle error
    }
  };

  const filteredPlans = plans.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (TYPE_LABELS[p.type] || p.type).toLowerCase().includes(q)
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
            <Shield className="w-6 h-6 text-cyan-600" />
            <h1 className="text-2xl font-bold text-gray-900">
              สิทธิการรักษา
            </h1>
          </div>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          เพิ่มสิทธิ
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="relative mb-4">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อสิทธิ หรือประเภท..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
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
                  <th className="pb-3 font-medium">ชื่อสิทธิ</th>
                  <th className="pb-3 font-medium">ประเภท</th>
                  <th className="pb-3 font-medium text-right">ส่วนลด (%)</th>
                  <th className="pb-3 font-medium text-right">เพดาน (บาท)</th>
                  <th className="pb-3 font-medium">สถานะ</th>
                  <th className="pb-3 font-medium text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlans.map((plan) => (
                  <tr
                    key={plan.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3">
                      <div className="font-medium text-gray-900">
                        {plan.name}
                      </div>
                      {plan.description && (
                        <div className="text-xs text-gray-400 mt-0.5">
                          {plan.description}
                        </div>
                      )}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${TYPE_COLORS[plan.type] || "bg-gray-100"}`}
                      >
                        {TYPE_LABELS[plan.type] || plan.type}
                      </span>
                    </td>
                    <td className="py-3 text-right font-medium">
                      {plan.discountPercent}%
                    </td>
                    <td className="py-3 text-right text-gray-600">
                      {plan.coverageLimit > 0
                        ? plan.coverageLimit.toLocaleString("th-TH")
                        : "ไม่จำกัด"}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${plan.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                      >
                        {plan.isActive ? "เปิด" : "ปิด"}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(plan)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                          title="แก้ไข"
                        >
                          <Edit2 className="w-4 h-4 text-gray-500" />
                        </button>
                        <button
                          onClick={() => toggleActive(plan)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                          title={plan.isActive ? "ปิดสิทธิ" : "เปิดสิทธิ"}
                        >
                          {plan.isActive ? (
                            <ToggleRight className="w-4 h-4 text-green-600" />
                          ) : (
                            <ToggleLeft className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredPlans.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-10 text-gray-400"
                    >
                      {search
                        ? "ไม่พบสิทธิที่ตรงกัน"
                        : "ยังไม่มีสิทธิการรักษาในระบบ"}
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingPlan ? "แก้ไขสิทธิการรักษา" : "เพิ่มสิทธิการรักษา"}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อสิทธิ <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="ชื่อสิทธิการรักษา"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ประเภท
                </label>
                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm({ ...form, type: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  {PLAN_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ส่วนลด (%)
                  </label>
                  <input
                    type="number"
                    value={form.discountPercent}
                    onChange={(e) =>
                      setForm({ ...form, discountPercent: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="0"
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    เพดานวงเงิน (บาท)
                  </label>
                  <input
                    type="number"
                    value={form.coverageLimit}
                    onChange={(e) =>
                      setForm({ ...form, coverageLimit: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="0 = ไม่จำกัด"
                    min="0"
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
                {editingPlan ? "บันทึก" : "เพิ่มสิทธิ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
