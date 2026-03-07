import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Building2,
  Users,
  Stethoscope,
  DoorOpen,
  Shield,
  Banknote,
  Bell,
  FileText,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";

export const dynamic = "force-dynamic";

const settingsLinks = [
  {
    href: "/settings/clinic",
    icon: Building2,
    title: "ข้อมูลคลินิก",
    description: "ชื่อคลินิก ที่อยู่ เบอร์โทร เวลาทำการ",
    color: "text-blue-600 bg-blue-50",
  },
  {
    href: "/settings/users",
    icon: Users,
    title: "จัดการผู้ใช้",
    description: "แพทย์ พยาบาล เภสัชกร พนักงาน",
    color: "text-purple-600 bg-purple-50",
  },
  {
    href: "/settings/services",
    icon: Stethoscope,
    title: "บริการ",
    description: "รายการบริการ ราคา หมวดหมู่",
    color: "text-green-600 bg-green-50",
  },
  {
    href: "/settings/rooms",
    icon: DoorOpen,
    title: "ห้องตรวจ",
    description: "ห้องตรวจ สถานะห้อง แพทย์ประจำห้อง",
    color: "text-orange-600 bg-orange-50",
  },
  {
    href: "/settings/insurance",
    icon: Shield,
    title: "สิทธิการรักษา",
    description: "UC ประกันสังคม ราชการ ประกันเอกชน",
    color: "text-cyan-600 bg-cyan-50",
  },
  {
    href: "/settings/finance",
    icon: Banknote,
    title: "ตั้งค่าการเงิน",
    description: "ช่องทางชำระเงิน ภาษี ใบเสร็จ",
    color: "text-emerald-600 bg-emerald-50",
  },
  {
    href: "/settings/notifications",
    icon: Bell,
    title: "การแจ้งเตือน",
    description: "SMS LINE Email การแจ้งเตือนนัดหมาย",
    color: "text-yellow-600 bg-yellow-50",
  },
  {
    href: "/settings/documents",
    icon: FileText,
    title: "หัวกระดาษเอกสาร",
    description: "ใบเสร็จ ใบรับรองแพทย์ ใบสั่งยา",
    color: "text-pink-600 bg-pink-50",
  },
];

export default async function SettingsPage() {
  const clinic = await prisma.clinic.findFirst();
  const userCount = await prisma.user.count();
  const serviceCount = await prisma.service.count();
  const roomCount = await prisma.examinationRoom.count();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">ตั้งค่าระบบ</h1>

      {/* Clinic Summary Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center">
              <Building2 className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {clinic?.nameTh || "ยังไม่ได้ตั้งค่าคลินิก"}
              </h2>
              {clinic?.nameEn && (
                <p className="text-sm text-gray-500">{clinic.nameEn}</p>
              )}
              {clinic?.licenseNumber && (
                <p className="text-xs text-gray-400 mt-0.5">
                  เลขใบอนุญาต: {clinic.licenseNumber}
                </p>
              )}
            </div>
          </div>
          <Link
            href="/settings/clinic"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            แก้ไข
          </Link>
        </div>

        {clinic && (
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-3">
            {clinic.phone && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="w-4 h-4 text-gray-400" />
                {clinic.phone}
              </div>
            )}
            {clinic.email && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4 text-gray-400" />
                {clinic.email}
              </div>
            )}
            {clinic.address && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-gray-400" />
                {clinic.address}
              </div>
            )}
          </div>
        )}

        {/* Quick Stats */}
        <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{userCount}</p>
            <p className="text-xs text-gray-500">ผู้ใช้งาน</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{serviceCount}</p>
            <p className="text-xs text-gray-500">บริการ</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{roomCount}</p>
            <p className="text-xs text-gray-500">ห้องตรวจ</p>
          </div>
        </div>
      </div>

      {/* Settings Links Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {settingsLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md hover:border-gray-300 transition-all group"
            >
              <div className="flex items-start justify-between">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${link.color}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors" />
              </div>
              <h3 className="mt-3 font-semibold text-gray-900">{link.title}</h3>
              <p className="mt-1 text-xs text-gray-500">{link.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
