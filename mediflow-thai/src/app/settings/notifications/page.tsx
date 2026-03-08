"use client";

import { useEffect, useState } from "react";
import { Save, MessageSquare, Mail, Bell, Smartphone } from "lucide-react";

interface ChannelSettings {
  enabled: boolean;
  provider: string;
  template: string;
}

interface EventSettings {
  enabled: boolean;
  timing: string;
}

interface NotificationSettings {
  channels: {
    sms: ChannelSettings;
    line: ChannelSettings & { lineOaId: string };
    email: ChannelSettings & { smtpHost: string; smtpPort: string; smtpUser: string; smtpPass: string };
    inApp: { enabled: boolean };
  };
  events: {
    appointmentReminder: EventSettings;
    queueCall: { enabled: boolean };
    labResultReady: { enabled: boolean };
    paymentDue: { enabled: boolean };
  };
}

interface Clinic {
  id: string;
  nameTh: string;
  settings: string;
}

const TEMPLATE_VARIABLES = [
  { var: "{patient_name}", desc: "ชื่อผู้ป่วย" },
  { var: "{appointment_date}", desc: "วันที่นัดหมาย" },
  { var: "{appointment_time}", desc: "เวลานัดหมาย" },
  { var: "{clinic_name}", desc: "ชื่อคลินิก" },
  { var: "{doctor_name}", desc: "ชื่อแพทย์" },
  { var: "{queue_number}", desc: "หมายเลขคิว" },
  { var: "{service_name}", desc: "ชื่อบริการ" },
];

const DEFAULT_SETTINGS: NotificationSettings = {
  channels: {
    sms: { enabled: false, provider: "", template: "สวัสดีค่ะ {patient_name} คลินิก {clinic_name} แจ้งเตือนนัดหมาย วันที่ {appointment_date} เวลา {appointment_time}" },
    line: { enabled: false, lineOaId: "", provider: "", template: "นัดหมาย: {patient_name}\nวันที่: {appointment_date}\nเวลา: {appointment_time}\nแพทย์: {doctor_name}" },
    email: { enabled: false, smtpHost: "", smtpPort: "587", smtpUser: "", smtpPass: "", provider: "", template: "เรียน {patient_name}\n\nขอแจ้งเตือนนัดหมาย\nวันที่: {appointment_date}\nเวลา: {appointment_time}\nแพทย์: {doctor_name}\n\nด้วยความเคารพ\n{clinic_name}" },
    inApp: { enabled: true },
  },
  events: {
    appointmentReminder: { enabled: true, timing: "1day" },
    queueCall: { enabled: true },
    labResultReady: { enabled: false },
    paymentDue: { enabled: false },
  },
};

export default function NotificationsSettingsPage() {
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState<"channels" | "events" | "templates">("channels");

  useEffect(() => {
    fetch("/api/settings/clinic")
      .then((r) => r.json())
      .then((data) => {
        setClinic(data);
        try {
          const parsed = JSON.parse(data.settings || "{}");
          if (parsed.notifications) {
            setSettings({
              channels: {
                sms: { ...DEFAULT_SETTINGS.channels.sms, ...parsed.notifications.channels?.sms },
                line: { ...DEFAULT_SETTINGS.channels.line, ...parsed.notifications.channels?.line },
                email: { ...DEFAULT_SETTINGS.channels.email, ...parsed.notifications.channels?.email },
                inApp: { ...DEFAULT_SETTINGS.channels.inApp, ...parsed.notifications.channels?.inApp },
              },
              events: {
                appointmentReminder: { ...DEFAULT_SETTINGS.events.appointmentReminder, ...parsed.notifications.events?.appointmentReminder },
                queueCall: { ...DEFAULT_SETTINGS.events.queueCall, ...parsed.notifications.events?.queueCall },
                labResultReady: { ...DEFAULT_SETTINGS.events.labResultReady, ...parsed.notifications.events?.labResultReady },
                paymentDue: { ...DEFAULT_SETTINGS.events.paymentDue, ...parsed.notifications.events?.paymentDue },
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
        notifications: settings,
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

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button
      type="button"
      onClick={onChange}
      className={`relative w-12 h-6 rounded-full transition ${checked ? "bg-blue-600" : "bg-gray-300"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
          checked ? "translate-x-6" : ""
        }`}
      />
    </button>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ตั้งค่าการแจ้งเตือน</h1>
          <p className="text-sm text-gray-500 mt-1">กำหนดช่องทางและเหตุการณ์แจ้งเตือน</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
          >
            <Save className="w-4 h-4" />
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </button>
          {saved && <span className="text-sm text-green-600 font-medium">บันทึกสำเร็จ</span>}
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveSection("channels")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeSection === "channels" ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-200"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          ช่องทางแจ้งเตือน
        </button>
        <button
          onClick={() => setActiveSection("events")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeSection === "events" ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Bell className="w-4 h-4" />
          เหตุการณ์
        </button>
        <button
          onClick={() => setActiveSection("templates")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeSection === "templates" ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Mail className="w-4 h-4" />
          เทมเพลตข้อความ
        </button>
      </div>

      {/* Channels Section */}
      {activeSection === "channels" && (
        <div className="space-y-4">
          {/* SMS */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">SMS</h3>
                  <p className="text-xs text-gray-500">ส่งข้อความผ่าน SMS</p>
                </div>
              </div>
              <Toggle
                checked={settings.channels.sms.enabled}
                onChange={() =>
                  setSettings({
                    ...settings,
                    channels: {
                      ...settings.channels,
                      sms: { ...settings.channels.sms, enabled: !settings.channels.sms.enabled },
                    },
                  })
                }
              />
            </div>
            {settings.channels.sms.enabled && (
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ผู้ให้บริการ SMS</label>
                  <input
                    type="text"
                    value={settings.channels.sms.provider}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        channels: {
                          ...settings.channels,
                          sms: { ...settings.channels.sms, provider: e.target.value },
                        },
                      })
                    }
                    placeholder="เช่น ThaiBulkSMS, SMSGateway..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* LINE */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">LINE</h3>
                  <p className="text-xs text-gray-500">ส่งผ่าน LINE Official Account</p>
                </div>
              </div>
              <Toggle
                checked={settings.channels.line.enabled}
                onChange={() =>
                  setSettings({
                    ...settings,
                    channels: {
                      ...settings.channels,
                      line: { ...settings.channels.line, enabled: !settings.channels.line.enabled },
                    },
                  })
                }
              />
            </div>
            {settings.channels.line.enabled && (
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">LINE OA Channel ID</label>
                  <input
                    type="text"
                    value={settings.channels.line.lineOaId}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        channels: {
                          ...settings.channels,
                          line: { ...settings.channels.line, lineOaId: e.target.value },
                        },
                      })
                    }
                    placeholder="LINE OA Channel ID..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Email */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Email</h3>
                  <p className="text-xs text-gray-500">ส่งผ่านอีเมล SMTP</p>
                </div>
              </div>
              <Toggle
                checked={settings.channels.email.enabled}
                onChange={() =>
                  setSettings({
                    ...settings,
                    channels: {
                      ...settings.channels,
                      email: { ...settings.channels.email, enabled: !settings.channels.email.enabled },
                    },
                  })
                }
              />
            </div>
            {settings.channels.email.enabled && (
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Host</label>
                    <input
                      type="text"
                      value={settings.channels.email.smtpHost}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          channels: {
                            ...settings.channels,
                            email: { ...settings.channels.email, smtpHost: e.target.value },
                          },
                        })
                      }
                      placeholder="smtp.gmail.com"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Port</label>
                    <input
                      type="text"
                      value={settings.channels.email.smtpPort}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          channels: {
                            ...settings.channels,
                            email: { ...settings.channels.email, smtpPort: e.target.value },
                          },
                        })
                      }
                      placeholder="587"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Username</label>
                    <input
                      type="text"
                      value={settings.channels.email.smtpUser}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          channels: {
                            ...settings.channels,
                            email: { ...settings.channels.email, smtpUser: e.target.value },
                          },
                        })
                      }
                      placeholder="user@example.com"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Password</label>
                    <input
                      type="password"
                      value={settings.channels.email.smtpPass}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          channels: {
                            ...settings.channels,
                            email: { ...settings.channels.email, smtpPass: e.target.value },
                          },
                        })
                      }
                      placeholder="********"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* In-App */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Bell className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">In-App</h3>
                  <p className="text-xs text-gray-500">แจ้งเตือนภายในแอปพลิเคชัน</p>
                </div>
              </div>
              <Toggle
                checked={settings.channels.inApp.enabled}
                onChange={() =>
                  setSettings({
                    ...settings,
                    channels: {
                      ...settings.channels,
                      inApp: { enabled: !settings.channels.inApp.enabled },
                    },
                  })
                }
              />
            </div>
          </div>
        </div>
      )}

      {/* Events Section */}
      {activeSection === "events" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">เหตุการณ์แจ้งเตือน</h2>

          <div className="space-y-4">
            {/* Appointment Reminder */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium text-gray-900">แจ้งเตือนนัดหมาย</p>
                  <p className="text-xs text-gray-500">ส่งแจ้งเตือนก่อนถึงวันนัดหมาย</p>
                </div>
                <Toggle
                  checked={settings.events.appointmentReminder.enabled}
                  onChange={() =>
                    setSettings({
                      ...settings,
                      events: {
                        ...settings.events,
                        appointmentReminder: {
                          ...settings.events.appointmentReminder,
                          enabled: !settings.events.appointmentReminder.enabled,
                        },
                      },
                    })
                  }
                />
              </div>
              {settings.events.appointmentReminder.enabled && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">เวลาแจ้งเตือนล่วงหน้า</label>
                  <select
                    value={settings.events.appointmentReminder.timing}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        events: {
                          ...settings.events,
                          appointmentReminder: {
                            ...settings.events.appointmentReminder,
                            timing: e.target.value,
                          },
                        },
                      })
                    }
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="1hour">1 ชั่วโมงก่อน</option>
                    <option value="3hours">3 ชั่วโมงก่อน</option>
                    <option value="1day">1 วันก่อน</option>
                    <option value="2days">2 วันก่อน</option>
                    <option value="1week">1 สัปดาห์ก่อน</option>
                  </select>
                </div>
              )}
            </div>

            {/* Queue Call */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">เรียกคิว</p>
                <p className="text-xs text-gray-500">แจ้งเตือนเมื่อถึงคิวของผู้ป่วย</p>
              </div>
              <Toggle
                checked={settings.events.queueCall.enabled}
                onChange={() =>
                  setSettings({
                    ...settings,
                    events: {
                      ...settings.events,
                      queueCall: { enabled: !settings.events.queueCall.enabled },
                    },
                  })
                }
              />
            </div>

            {/* Lab Result Ready */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">ผลแล็บพร้อม</p>
                <p className="text-xs text-gray-500">แจ้งเตือนเมื่อผลตรวจพร้อมแล้ว</p>
              </div>
              <Toggle
                checked={settings.events.labResultReady.enabled}
                onChange={() =>
                  setSettings({
                    ...settings,
                    events: {
                      ...settings.events,
                      labResultReady: { enabled: !settings.events.labResultReady.enabled },
                    },
                  })
                }
              />
            </div>

            {/* Payment Due */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">แจ้งค่าใช้จ่าย</p>
                <p className="text-xs text-gray-500">แจ้งเตือนเมื่อมียอดค้างชำระ</p>
              </div>
              <Toggle
                checked={settings.events.paymentDue.enabled}
                onChange={() =>
                  setSettings({
                    ...settings,
                    events: {
                      ...settings.events,
                      paymentDue: { enabled: !settings.events.paymentDue.enabled },
                    },
                  })
                }
              />
            </div>
          </div>
        </div>
      )}

      {/* Templates Section */}
      {activeSection === "templates" && (
        <div className="space-y-4">
          {/* Variables Reference */}
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">ตัวแปรที่ใช้ได้</h3>
            <div className="flex flex-wrap gap-2">
              {TEMPLATE_VARIABLES.map((v) => (
                <span
                  key={v.var}
                  className="inline-flex items-center gap-1 bg-white border border-blue-200 rounded px-2 py-1 text-xs"
                >
                  <code className="text-blue-700 font-mono">{v.var}</code>
                  <span className="text-gray-500">= {v.desc}</span>
                </span>
              ))}
            </div>
          </div>

          {/* SMS Template */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-3">เทมเพลต SMS</h3>
            <textarea
              value={settings.channels.sms.template}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  channels: {
                    ...settings.channels,
                    sms: { ...settings.channels.sms, template: e.target.value },
                  },
                })
              }
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
              placeholder="ข้อความ SMS..."
            />
          </div>

          {/* LINE Template */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-3">เทมเพลต LINE</h3>
            <textarea
              value={settings.channels.line.template}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  channels: {
                    ...settings.channels,
                    line: { ...settings.channels.line, template: e.target.value },
                  },
                })
              }
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
              placeholder="ข้อความ LINE..."
            />
          </div>

          {/* Email Template */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-3">เทมเพลต Email</h3>
            <textarea
              value={settings.channels.email.template}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  channels: {
                    ...settings.channels,
                    email: { ...settings.channels.email, template: e.target.value },
                  },
                })
              }
              rows={6}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
              placeholder="ข้อความ Email..."
            />
          </div>
        </div>
      )}
    </div>
  );
}
