"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users, Calendar, ClipboardList, Stethoscope,
  FlaskConical, Pill, Receipt, BarChart3,
  Settings, Home, UserPlus, MonitorPlay,
  DoorOpen, FileText, Package, FolderTree,
  Boxes, Truck, PackagePlus, Clock,
  Warehouse, ClipboardCheck, SlidersHorizontal,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const clinicMenuGroups = [
  {
    label: "หน้าหลัก",
    items: [
      { href: "/", icon: Home, label: "Dashboard" },
    ],
  },
  {
    label: "ผู้ป่วย",
    items: [
      { href: "/patients", icon: Users, label: "รายการผู้ป่วย" },
      { href: "/patients/new", icon: UserPlus, label: "ลงทะเบียนผู้ป่วย" },
    ],
  },
  {
    label: "นัดหมาย & คิว",
    items: [
      { href: "/appointments", icon: Calendar, label: "นัดหมาย" },
      { href: "/queue", icon: ClipboardList, label: "จัดการคิว" },
      { href: "/queue/display", icon: MonitorPlay, label: "แสดงคิว" },
    ],
  },
  {
    label: "คลินิก",
    items: [
      { href: "/screening", icon: Stethoscope, label: "คัดกรอง" },
      { href: "/doctor", icon: Stethoscope, label: "โต๊ะแพทย์" },
      { href: "/examination-rooms", icon: DoorOpen, label: "ห้องตรวจ" },
      { href: "/medical-records", icon: FileText, label: "เวชระเบียน" },
    ],
  },
  {
    label: "Lab & ยา",
    items: [
      { href: "/lab", icon: FlaskConical, label: "ผล Lab" },
      { href: "/pharmacy", icon: Pill, label: "ห้องยา" },
    ],
  },
  {
    label: "การเงิน & รายงาน",
    items: [
      { href: "/finance", icon: Receipt, label: "การเงิน" },
      { href: "/reports", icon: BarChart3, label: "รายงาน" },
    ],
  },
  {
    label: "ตั้งค่า",
    items: [
      { href: "/settings", icon: Settings, label: "ตั้งค่าระบบ" },
    ],
  },
];

const supplyMenuGroups = [
  {
    label: "ระบบพัสดุ",
    items: [
      { href: "/supply", icon: Package, label: "แดชบอร์ดพัสดุ" },
    ],
  },
  {
    label: "ข้อมูลหลัก",
    items: [
      { href: "/supply/categories", icon: FolderTree, label: "หมวดหมู่พัสดุ" },
      { href: "/supply/items", icon: Boxes, label: "รายการพัสดุ" },
      { href: "/supply/suppliers", icon: Truck, label: "ผู้จำหน่าย" },
    ],
  },
  {
    label: "รับเข้า-เบิกจ่าย",
    items: [
      { href: "/supply/receive", icon: PackagePlus, label: "รับพัสดุ" },
      { href: "/supply/requisitions", icon: FileText, label: "ใบเบิกพัสดุ" },
      { href: "/supply/requisitions/pending", icon: Clock, label: "รออนุมัติ" },
    ],
  },
  {
    label: "คลังพัสดุ",
    items: [
      { href: "/supply/stock", icon: Warehouse, label: "สต็อกคงเหลือ" },
      { href: "/supply/stock/count", icon: ClipboardCheck, label: "ตรวจนับประจำปี" },
      { href: "/supply/stock/adjust", icon: SlidersHorizontal, label: "ปรับปรุงสต็อก" },
      { href: "/supply/stock/writeoff", icon: Trash2, label: "ตัดจำหน่าย" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  const renderMenuGroups = (groups: typeof clinicMenuGroups) => (
    groups.map((group) => (
      <div key={group.label} className="mb-3">
        <p className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {group.label}
        </p>
        {group.items.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
    ))
  );

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-blue-600">MediFlow Thai</h1>
        <p className="text-xs text-gray-500">กานต์คลินิก</p>
      </div>
      <nav className="flex-1 overflow-y-auto p-2">
        {renderMenuGroups(clinicMenuGroups)}
        <hr className="my-3 border-gray-200" />
        {renderMenuGroups(supplyMenuGroups)}
      </nav>
    </aside>
  );
}
