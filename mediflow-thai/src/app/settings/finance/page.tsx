"use client";

import { useEffect, useState } from "react";
import { Save, ExternalLink, CreditCard, Receipt, Percent, ShieldCheck } from "lucide-react";
import Link from "next/link";

interface FinanceSettings {
  vatEnabled: boolean;
  vatRate: number;
  paymentMethods: {
    Cash: boolean;
    Transfer: boolean;
    CreditCard: boolean;
    QRPromptPay: boolean;
  };
}

interface Clinic {
  id: string;
  nameTh: string;
  settings: string;
}

const TABS = [
  { key: "services", label: "ราคาบริการ", icon: Receipt },
  { key: "vat", label: "ภาษี", icon: Percent },
  { key: "payment", label: "ช่องทางชำระเงิน", icon: CreditCard },
  { key: "insurance", label: "สิทธิการรักษา", icon: ShieldCheck },
];

const PAYMENT_LABELS: Record<string, string> = {
  Cash: "เงินสด",
  Transfer: "โอนเงิน",
  CreditCard: "บัตรเครดิต",
  QRPromptPay: "QR PromptPay",
};

export default function FinanceSettingsPage() {
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [activeTab, setActiveTab] = useState("vat");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [financeSettings, setFinanceSettings] = useState<FinanceSettings>({
    vatEnabled: false,
    vatRate: 7,
    paymentMethods: {
      Cash: true,
      Transfer: true,
      CreditCard: false,
      QRPromptPay: true,
    },
  });

  useEffect(() => {
    fetch("/api/settings/clinic")
      .then((r) => r.json())
      .then((data) => {
        setClinic(data);
        try {
          const settings = JSON.parse(data.settings || "{}");
          if (settings.finance) {
            setFinanceSettings({
              vatEnabled: settings.finance.vatEnabled ?? false,
              vatRate: settings.finance.vatRate ?? 7,
              paymentMethods: {
                Cash: settings.finance.paymentMethods?.Cash ?? true,
                Transfer: settings.finance.paymentMethods?.Transfer ?? true,
                CreditCard: settings.finance.paymentMethods?.CreditCard ?? false,
                QRPromptPay: settings.finance.paymentMethods?.QRPromptPay ?? true,
              },
            });
          }
        } catch {
          // Use defaults
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    if (!clinic) return;
    setSaving(true);
    setSaved(false);

    try {
      let existingSettings = {};
      try {
        existingSettings = JSON.parse(clinic.settings || "{}");
      } catch {
        // ignore
      }

      const updatedSettings = {
        ...existingSettings,
        finance: financeSettings,
      };

      const res = await fetch("/api/settings/clinic", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: clinic.id,
          settings: JSON.stringify(updatedSettings),
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setClinic(updated);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      console.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ตั้งค่าการเงิน</h1>
          <p className="text-sm text-gray-500 mt-1">จัดการภาษี ช่องทางชำระเงิน และราคาบริการ</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === tab.key
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "services" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">ราคาบริการ</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            จัดการรายการบริการและราคาได้ที่หน้าตั้งค่าบริการ
          </p>
          <Link
            href="/settings/services"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            ไปหน้าตั้งค่าบริการ
          </Link>
        </div>
      )}

      {activeTab === "vat" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">ตั้งค่าภาษีมูลค่าเพิ่ม (VAT)</h2>

          <div className="space-y-6">
            {/* VAT Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">เปิดใช้ภาษีมูลค่าเพิ่ม</p>
                <p className="text-sm text-gray-500">คำนวณ VAT อัตโนมัติในใบเสร็จ</p>
              </div>
              <button
                onClick={() =>
                  setFinanceSettings({
                    ...financeSettings,
                    vatEnabled: !financeSettings.vatEnabled,
                  })
                }
                className={`relative w-12 h-6 rounded-full transition ${
                  financeSettings.vatEnabled ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    financeSettings.vatEnabled ? "translate-x-6" : ""
                  }`}
                />
              </button>
            </div>

            {/* VAT Rate */}
            {financeSettings.vatEnabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  อัตรา VAT (%)
                </label>
                <input
                  type="number"
                  value={financeSettings.vatRate}
                  onChange={(e) =>
                    setFinanceSettings({
                      ...financeSettings,
                      vatRate: parseFloat(e.target.value) || 0,
                    })
                  }
                  min={0}
                  max={100}
                  step={0.5}
                  className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                <p className="text-xs text-gray-400 mt-1">
                  อัตรา VAT มาตรฐานของไทย: 7%
                </p>
              </div>
            )}

            {/* Save button */}
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
                <span className="text-sm text-green-600 font-medium">
                  บันทึกสำเร็จ
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "payment" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">ช่องทางชำระเงิน</h2>

          <div className="space-y-3">
            {(Object.keys(PAYMENT_LABELS) as Array<keyof typeof PAYMENT_LABELS>).map((key) => (
              <div
                key={key}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">{PAYMENT_LABELS[key]}</p>
                </div>
                <button
                  onClick={() =>
                    setFinanceSettings({
                      ...financeSettings,
                      paymentMethods: {
                        ...financeSettings.paymentMethods,
                        [key]:
                          !financeSettings.paymentMethods[
                            key as keyof typeof financeSettings.paymentMethods
                          ],
                      },
                    })
                  }
                  className={`relative w-12 h-6 rounded-full transition ${
                    financeSettings.paymentMethods[
                      key as keyof typeof financeSettings.paymentMethods
                    ]
                      ? "bg-blue-600"
                      : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      financeSettings.paymentMethods[
                        key as keyof typeof financeSettings.paymentMethods
                      ]
                        ? "translate-x-6"
                        : ""
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>

          {/* Save button */}
          <div className="flex items-center gap-3 pt-6 mt-6 border-t border-gray-200">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
            >
              <Save className="w-4 h-4" />
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </button>
            {saved && (
              <span className="text-sm text-green-600 font-medium">
                บันทึกสำเร็จ
              </span>
            )}
          </div>
        </div>
      )}

      {activeTab === "insurance" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">สิทธิการรักษา</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            จัดการสิทธิประกันสังคม บัตรทอง และสิทธิอื่นๆ ได้ที่หน้าตั้งค่าระบบ
          </p>
          <Link
            href="/settings/insurance"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            ไปหน้าตั้งค่าสิทธิการรักษา
          </Link>
        </div>
      )}
    </div>
  );
}
