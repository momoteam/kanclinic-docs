"use client";

import { useEffect, useState } from "react";
import { Save, FileText, Eye } from "lucide-react";

interface DocumentHeader {
  id: string;
  documentType: string;
  logoUrl: string;
  logoPosition: string;
  headerLine1: string;
  headerLine2: string;
  headerLine3: string;
  headerLine4: string;
  footerText: string;
  fontSize: number;
  textColor: string;
}

const DOC_TYPES = [
  { key: "Receipt", label: "ใบเสร็จรับเงิน" },
  { key: "Invoice", label: "ใบแจ้งหนี้" },
  { key: "MedCertificate", label: "ใบรับรองแพทย์" },
  { key: "Prescription", label: "ใบสั่งยา" },
  { key: "LabResult", label: "ผลตรวจแล็บ" },
];

const LOGO_POSITIONS = [
  { key: "Left", label: "ซ้าย" },
  { key: "Center", label: "กลาง" },
  { key: "Right", label: "ขวา" },
];

const DEFAULT_FORM: Omit<DocumentHeader, "id"> = {
  documentType: "Receipt",
  logoUrl: "",
  logoPosition: "Left",
  headerLine1: "",
  headerLine2: "",
  headerLine3: "",
  headerLine4: "",
  footerText: "",
  fontSize: 12,
  textColor: "#000000",
};

export default function DocumentsSettingsPage() {
  const [headers, setHeaders] = useState<DocumentHeader[]>([]);
  const [selectedType, setSelectedType] = useState("Receipt");
  const [form, setForm] = useState<Omit<DocumentHeader, "id"> & { id?: string }>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const fetchHeaders = async () => {
    try {
      const res = await fetch("/api/settings/documents");
      const data = await res.json();
      setHeaders(Array.isArray(data) ? data : []);
    } catch {
      console.error("Failed to fetch document headers");
    }
  };

  useEffect(() => {
    fetchHeaders();
  }, []);

  // Load form data when type changes
  useEffect(() => {
    const existing = headers.find((h) => h.documentType === selectedType);
    if (existing) {
      setForm({
        id: existing.id,
        documentType: existing.documentType,
        logoUrl: existing.logoUrl,
        logoPosition: existing.logoPosition,
        headerLine1: existing.headerLine1,
        headerLine2: existing.headerLine2,
        headerLine3: existing.headerLine3,
        headerLine4: existing.headerLine4,
        footerText: existing.footerText,
        fontSize: existing.fontSize,
        textColor: existing.textColor,
      });
    } else {
      setForm({ ...DEFAULT_FORM, documentType: selectedType });
    }
  }, [selectedType, headers]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    try {
      const method = form.id ? "PUT" : "POST";
      const res = await fetch("/api/settings/documents", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setSaved(true);
        fetchHeaders();
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      console.error("Failed to save document header");
    } finally {
      setSaving(false);
    }
  };

  const docTypeLabel = DOC_TYPES.find((d) => d.key === selectedType)?.label || selectedType;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ตั้งค่าเอกสาร</h1>
          <p className="text-sm text-gray-500 mt-1">กำหนดหัวกระดาษสำหรับเอกสารแต่ละประเภท</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document Type Selector */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">ประเภทเอกสาร</h3>
            <div className="space-y-1">
              {DOC_TYPES.map((type) => {
                const hasConfig = headers.some((h) => h.documentType === type.key);
                return (
                  <button
                    key={type.key}
                    onClick={() => setSelectedType(type.key)}
                    className={`w-full text-left px-4 py-3 rounded-lg text-sm transition flex items-center justify-between ${
                      selectedType === type.key
                        ? "bg-blue-100 text-blue-800 font-medium border border-blue-300"
                        : "hover:bg-gray-50 text-gray-700 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      {type.label}
                    </div>
                    {hasConfig && (
                      <span className="w-2 h-2 bg-green-500 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-800">
                ตั้งค่า: {docTypeLabel}
              </h2>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                <Eye className="w-4 h-4" />
                {showPreview ? "ซ่อนตัวอย่าง" : "ดูตัวอย่าง"}
              </button>
            </div>

            <div className="space-y-4">
              {/* Logo Position */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ตำแหน่งโลโก้</label>
                <div className="flex gap-2">
                  {LOGO_POSITIONS.map((pos) => (
                    <button
                      key={pos.key}
                      type="button"
                      onClick={() => setForm({ ...form, logoPosition: pos.key })}
                      className={`px-4 py-2 rounded-lg text-sm border transition ${
                        form.logoPosition === pos.key
                          ? "bg-blue-100 text-blue-800 border-blue-300"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {pos.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Logo URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL โลโก้</label>
                <input
                  type="text"
                  value={form.logoUrl}
                  onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                  placeholder="https://example.com/logo.png"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              {/* Header Lines */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">บรรทัดที่ 1 (ชื่อคลินิก)</label>
                <input
                  type="text"
                  value={form.headerLine1}
                  onChange={(e) => setForm({ ...form, headerLine1: e.target.value })}
                  placeholder="คลินิกของฉัน"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">บรรทัดที่ 2 (ที่อยู่)</label>
                <input
                  type="text"
                  value={form.headerLine2}
                  onChange={(e) => setForm({ ...form, headerLine2: e.target.value })}
                  placeholder="123 ถนนตัวอย่าง ตำบลตัวอย่าง"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">บรรทัดที่ 3 (เบอร์โทร)</label>
                <input
                  type="text"
                  value={form.headerLine3}
                  onChange={(e) => setForm({ ...form, headerLine3: e.target.value })}
                  placeholder="โทร. 02-xxx-xxxx"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">บรรทัดที่ 4 (เลขทะเบียน)</label>
                <input
                  type="text"
                  value={form.headerLine4}
                  onChange={(e) => setForm({ ...form, headerLine4: e.target.value })}
                  placeholder="ใบอนุญาตเลขที่ xxx/xxxx"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              {/* Footer */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ข้อความท้ายเอกสาร</label>
                <textarea
                  value={form.footerText}
                  onChange={(e) => setForm({ ...form, footerText: e.target.value })}
                  placeholder="ขอบคุณที่ใช้บริการ..."
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              {/* Font Size and Color */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ขนาดตัวอักษร (px)</label>
                  <input
                    type="number"
                    value={form.fontSize}
                    onChange={(e) => setForm({ ...form, fontSize: parseInt(e.target.value) || 12 })}
                    min={8}
                    max={24}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">สีตัวอักษร</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.textColor}
                      onChange={(e) => setForm({ ...form, textColor: e.target.value })}
                      className="w-10 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={form.textColor}
                      onChange={(e) => setForm({ ...form, textColor: e.target.value })}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Save */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "กำลังบันทึก..." : "บันทึก"}
                </button>
                {saved && (
                  <span className="text-sm text-green-600 font-medium">บันทึกสำเร็จ</span>
                )}
              </div>
            </div>
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">ตัวอย่างหัวเอกสาร</h3>
              <div
                className="border border-gray-300 rounded-lg p-8 bg-white min-h-[200px]"
                style={{ fontSize: `${form.fontSize}px`, color: form.textColor }}
              >
                <div
                  className={`flex flex-col ${
                    form.logoPosition === "Center"
                      ? "items-center text-center"
                      : form.logoPosition === "Right"
                      ? "items-end text-right"
                      : "items-start text-left"
                  }`}
                >
                  {form.logoUrl && (
                    <div className="mb-3">
                      <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-400">
                        LOGO
                      </div>
                    </div>
                  )}
                  {form.headerLine1 && (
                    <p className="font-bold text-lg" style={{ color: form.textColor }}>
                      {form.headerLine1}
                    </p>
                  )}
                  {form.headerLine2 && (
                    <p style={{ color: form.textColor }}>{form.headerLine2}</p>
                  )}
                  {form.headerLine3 && (
                    <p style={{ color: form.textColor }}>{form.headerLine3}</p>
                  )}
                  {form.headerLine4 && (
                    <p style={{ color: form.textColor }}>{form.headerLine4}</p>
                  )}
                </div>

                <hr className="my-4 border-gray-300" />

                <div className="text-center text-gray-400 text-sm py-8">
                  -- เนื้อหาเอกสาร ({docTypeLabel}) --
                </div>

                {form.footerText && (
                  <>
                    <hr className="my-4 border-gray-300" />
                    <p className="text-center text-sm" style={{ color: form.textColor }}>
                      {form.footerText}
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
