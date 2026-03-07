"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { formatDate, SUPPLY_REQ_STATUS_LABELS, SUPPLY_REQ_STATUS_COLORS } from "@/lib/utils";

interface ReqItem { supplyItem: { code: string; nameTh: string; unit: string }; requestedQty: number; approvedQty: number | null; disbursedQty: number | null; }
interface Requisition {
  id: string; requisitionNumber: string; requestedDate: string; purpose: string; status: string; notes: string;
  department: { nameTh: string }; requestedBy: { firstName: string; lastName: string };
  approvedBy?: { firstName: string; lastName: string } | null;
  items: ReqItem[];
}

const STATUS_TABS = ["", "Pending", "Approved", "Disbursed", "Rejected"];

export default function RequisitionsPage() {
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  const fetchData = async () => {
    const url = statusFilter ? `/api/supply/requisitions?status=${statusFilter}` : "/api/supply/requisitions";
    const res = await fetch(url);
    setRequisitions(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [statusFilter]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">ใบเบิกพัสดุ</h1>
        </div>
        <Link href="/supply/requisitions/new" className="flex items-center gap-2 bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700">
          <Plus className="w-4 h-4" /> สร้างใบเบิก
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex gap-2">
          {STATUS_TABS.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm ${statusFilter === s ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
              {s ? (SUPPLY_REQ_STATUS_LABELS[s] || s) : "ทั้งหมด"}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-gray-500">เลขที่ใบเบิก</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">วันที่</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">หน่วยงาน</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">ผู้เบิก</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">วัตถุประสงค์</th>
              <th className="text-center py-3 px-4 font-medium text-gray-500">จำนวนรายการ</th>
              <th className="text-center py-3 px-4 font-medium text-gray-500">สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {requisitions.map((r) => (
              <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 font-mono text-xs font-medium">{r.requisitionNumber}</td>
                <td className="py-3 px-4">{formatDate(r.requestedDate)}</td>
                <td className="py-3 px-4">{r.department?.nameTh || "-"}</td>
                <td className="py-3 px-4">{r.requestedBy.firstName} {r.requestedBy.lastName}</td>
                <td className="py-3 px-4 text-gray-500 max-w-xs truncate">{r.purpose || "-"}</td>
                <td className="py-3 px-4 text-center">{r.items.length}</td>
                <td className="py-3 px-4 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${SUPPLY_REQ_STATUS_COLORS[r.status] || "bg-gray-100 text-gray-500"}`}>
                    {SUPPLY_REQ_STATUS_LABELS[r.status] || r.status}
                  </span>
                </td>
              </tr>
            ))}
            {requisitions.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-gray-400">ไม่พบข้อมูล</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
