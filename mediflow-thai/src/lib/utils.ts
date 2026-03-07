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
