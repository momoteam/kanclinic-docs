import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function calculateAge(dateOfBirth: Date | string): number {
  const dob = new Date(dateOfBirth);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

export function generateHN(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `KAN-${dateStr}-${rand}`;
}

export function maskIdCard(idCard: string): string {
  if (!idCard || idCard.length < 13) return idCard;
  return `${idCard.slice(0, 3)}-xxxx-xxx-xx-${idCard.slice(12)}`;
}

export const STATION_LABELS: Record<string, string> = {
  WaitScreening: "รอคัดกรอง",
  Screening: "กำลังคัดกรอง",
  WaitDoctor: "รอพบแพทย์",
  WithDoctor: "กำลังตรวจ",
  WaitPharmacy: "รอรับยา",
  WaitPayment: "รอชำระเงิน",
  Completed: "เสร็จสิ้น",
};

export const STATION_COLORS: Record<string, string> = {
  WaitScreening: "bg-yellow-100 text-yellow-800",
  Screening: "bg-blue-100 text-blue-800",
  WaitDoctor: "bg-orange-100 text-orange-800",
  WithDoctor: "bg-purple-100 text-purple-800",
  WaitPharmacy: "bg-cyan-100 text-cyan-800",
  WaitPayment: "bg-pink-100 text-pink-800",
  Completed: "bg-green-100 text-green-800",
};

// ===================== SUPPLY MANAGEMENT =====================

export function generateReceiveNumber(): string {
  const now = new Date();
  const by = now.getFullYear() + 543;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `RCV-${by}-${String(rand).padStart(4, "0")}`;
}

export function generateRequisitionNumber(): string {
  const now = new Date();
  const by = now.getFullYear() + 543;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `REQ-${by}-${String(rand).padStart(4, "0")}`;
}

export function generateWriteOffNumber(): string {
  const now = new Date();
  const by = now.getFullYear() + 543;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `WOF-${by}-${String(rand).padStart(4, "0")}`;
}

export function generateCountNumber(): string {
  const now = new Date();
  const by = now.getFullYear() + 543;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `CNT-${by}-${String(rand).padStart(4, "0")}`;
}

export function formatCurrency(amount: number): string {
  return amount.toLocaleString("th-TH", { minimumFractionDigits: 2 });
}

export const SUPPLY_REQ_STATUS_LABELS: Record<string, string> = {
  Pending: "รออนุมัติ",
  Approved: "อนุมัติแล้ว",
  PartialApproved: "อนุมัติบางส่วน",
  Rejected: "ไม่อนุมัติ",
  Disbursed: "เบิกจ่ายแล้ว",
  Cancelled: "ยกเลิก",
};

export const SUPPLY_REQ_STATUS_COLORS: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-700",
  Approved: "bg-green-100 text-green-700",
  PartialApproved: "bg-blue-100 text-blue-700",
  Rejected: "bg-red-100 text-red-700",
  Disbursed: "bg-purple-100 text-purple-700",
  Cancelled: "bg-gray-100 text-gray-500",
};

export const SUPPLY_MOVEMENT_LABELS: Record<string, string> = {
  Receive: "รับเข้า",
  Disburse: "จ่ายออก",
  AdjustIncrease: "ปรับเพิ่ม",
  AdjustDecrease: "ปรับลด",
  WriteOff: "ตัดจำหน่าย",
  ReturnToStock: "คืนคลัง",
  CountAdjust: "ปรับตามตรวจนับ",
};

export const SUPPLY_MOVEMENT_COLORS: Record<string, string> = {
  Receive: "text-green-600",
  Disburse: "text-red-600",
  AdjustIncrease: "text-green-600",
  AdjustDecrease: "text-red-600",
  WriteOff: "text-red-600",
  ReturnToStock: "text-blue-600",
  CountAdjust: "text-orange-600",
};
