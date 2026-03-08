"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Building2,
  Loader2,
  CheckCircle,
} from "lucide-react";

interface ClinicData {
  id: string;
  nameTh: string;
  nameEn: string;
  licenseNumber: string;
  clinicType: string;
  address: string;
  subDistrict: string;
  district: string;
  province: string;
  postalCode: string;
  phone: string;
  fax: string;
  email: string;
  website: string;
  lineOa: string;
  operatingHours: string;
}

const CLINIC_TYPES = [
  { value: "general", label: "คลินิกทั่วไป" },
  { value: "specialist", label: "คลินิกเฉพาะทาง" },
  { value: "dental", label: "คลินิกทันตกรรม" },
  { value: "beauty", label: "คลินิกความงาม" },
  { value: "rehabilitation", label: "คลินิกกายภาพบำบัด" },
  { value: "eye", label: "คลินิกจักษุ" },
  { value: "other", label: "อื่นๆ" },
];

const DEFAULT_HOURS = {
  monday: { open: "08:00", close: "17:00", isOpen: true },
  tuesday: { open: "08:00", close: "17:00", isOpen: true },
  wednesday: { open: "08:00", close: "17:00", isOpen: true },
  thursday: { open: "08:00", close: "17:00", isOpen: true },
  friday: { open: "08:00", close: "17:00", isOpen: true },
  saturday: { open: "09:00", close: "14:00", isOpen: true },
  sunday: { open: "", close: "", isOpen: false },
};

const DAY_LABELS: Record<string, string> = {
  monday: "วันจันทร์",
  tuesday: "วันอังคาร",
  wednesday: "วันพุธ",
  thursday: "วันพฤหัสบดี",
  friday: "วันศุกร์",
  saturday: "วันเสาร์",
  sunday: "วันอาทิตย์",
};

export default function ClinicSettingsPage() {
  const [form, setForm] = useState<ClinicData | null>(null);
  const [hours, setHours] = useState<
    Record<string, { open: string; close: string; isOpen: boolean }>
  >(DEFAULT_HOURS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings/clinic")
      .then((res) => res.json())
      .then((data) => {
        setForm(data);
        try {
          const parsed = JSON.parse(data.operatingHours || "{}");
          if (Object.keys(parsed).length > 0) {
            setHours({ ...DEFAULT_HOURS, ...parsed });
          }
        } catch {
          // Use defaults
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    if (!form) return;
    setForm({ ...form, [e.target.name]: e.target.value });
    setSaved(false);
  };

  const handleHoursChange = (
    day: string,
    field: string,
    value: string | boolean
  ) => {
    setHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    try {
      await fetch("/api/settings/clinic", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          operatingHours: JSON.stringify(hours),
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="text-center py-20 text-gray-500">
        ไม่สามารถโหลดข้อมูลคลินิกได้
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
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
            <Building2 className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">ข้อมูลคลินิก</h1>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? "กำลังบันทึก..." : saved ? "บันทึกแล้ว" : "บันทึก"}
        </button>
      </div>

      {/* Basic Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          ข้อมูลทั่วไป
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ชื่อคลินิก (ไทย) <span className="text-red-500">*</span>
            </label>
            <input
              name="nameTh"
              value={form.nameTh}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="ชื่อคลินิกภาษาไทย"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ชื่อคลินิก (อังกฤษ)
            </label>
            <input
              name="nameEn"
              value={form.nameEn}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Clinic name in English"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              เลขใบอนุญาต
            </label>
            <input
              name="licenseNumber"
              value={form.licenseNumber}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="เลขที่ใบอนุญาตประกอบกิจการ"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ประเภทคลินิก
            </label>
            <select
              name="clinicType"
              value={form.clinicType}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              {CLINIC_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">ที่อยู่</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ที่อยู่
            </label>
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              placeholder="เลขที่ ถนน ซอย"
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                แขวง/ตำบล
              </label>
              <input
                name="subDistrict"
                value={form.subDistrict}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                เขต/อำเภอ
              </label>
              <input
                name="district"
                value={form.district}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                จังหวัด
              </label>
              <input
                name="province"
                value={form.province}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                รหัสไปรษณีย์
              </label>
              <input
                name="postalCode"
                value={form.postalCode}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          ช่องทางติดต่อ
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              เบอร์โทรศัพท์
            </label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="02-xxx-xxxx"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              แฟกซ์
            </label>
            <input
              name="fax"
              value={form.fax}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="02-xxx-xxxx"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              อีเมล
            </label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="clinic@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              เว็บไซต์
            </label>
            <input
              name="website"
              value={form.website}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="https://www.clinic.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              LINE OA
            </label>
            <input
              name="lineOa"
              value={form.lineOa}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="@clinicline"
            />
          </div>
        </div>
      </div>

      {/* Operating Hours */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          เวลาทำการ
        </h2>
        <div className="space-y-3">
          {Object.entries(hours).map(([day, schedule]) => (
            <div
              key={day}
              className="flex items-center gap-4 py-2 border-b border-gray-100 last:border-0"
            >
              <div className="w-28">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={schedule.isOpen}
                    onChange={(e) =>
                      handleHoursChange(day, "isOpen", e.target.checked)
                    }
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span
                    className={`text-sm font-medium ${schedule.isOpen ? "text-gray-900" : "text-gray-400"}`}
                  >
                    {DAY_LABELS[day]}
                  </span>
                </label>
              </div>
              {schedule.isOpen ? (
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={schedule.open}
                    onChange={(e) =>
                      handleHoursChange(day, "open", e.target.value)
                    }
                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="time"
                    value={schedule.close}
                    onChange={(e) =>
                      handleHoursChange(day, "close", e.target.value)
                    }
                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              ) : (
                <span className="text-sm text-gray-400">ปิดทำการ</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
