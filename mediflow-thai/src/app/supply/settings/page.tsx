import Link from "next/link";
import { Settings, Building2, ScrollText } from "lucide-react";

const settingsItems = [
  { href: "/supply/settings/departments", icon: Building2, label: "หน่วยงาน", desc: "จัดการหน่วยงานที่เบิกพัสดุ" },
  { href: "/supply/settings/logs", icon: ScrollText, label: "บันทึกการใช้งาน", desc: "ดูประวัติการใช้งานระบบ" },
];

export default function SupplySettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">ตั้งค่าระบบพัสดุ</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {settingsItems.map((item) => (
          <Link key={item.href} href={item.href}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:border-blue-300 hover:shadow-md transition-all flex items-start gap-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <item.icon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{item.label}</h3>
              <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
