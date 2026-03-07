"use client";

import { useState, useEffect } from "react";
import { Clock, CheckCircle, XCircle, PackageMinus } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface ReqItem { id: string; requestedQty: number; approvedQty: number | null; supplyItem: { code: string; nameTh: string; unit: string }; }
interface Requisition {
  id: string; requisitionNumber: string; requestedDate: string; purpose: string; status: string;
  department: { nameTh: string }; requestedBy: { firstName: string; lastName: string };
  items: ReqItem[];
}

export default function PendingRequisitionsPage() {
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchData = async () => {
    const res = await fetch("/api/supply/requisitions?status=Pending");
    setRequisitions(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleApprove = async (req: Requisition) => {
    setProcessing(req.id);
    await fetch("/api/supply/requisitions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: req.id,
        action: "approve",
        items: req.items.map((i) => ({ id: i.id, approvedQty: i.requestedQty })),
      }),
    });
    setProcessing("");
    fetchData();
  };

  const handleReject = async (id: string) => {
    setProcessing(id);
    await fetch("/api/supply/requisitions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "reject", approverNotes: "ไม่อนุมัติ" }),
    });
    setProcessing("");
    fetchData();
  };

  const handleDisburse = async (id: string) => {
    setProcessing(id);
    await fetch("/api/supply/requisitions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "disburse" }),
    });
    setProcessing("");
    fetchData();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Clock className="w-6 h-6 text-yellow-600" />
        <h1 className="text-2xl font-bold text-gray-900">ใบเบิกรออนุมัติ ({requisitions.length})</h1>
      </div>

      {requisitions.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-400">ไม่มีใบเบิกรออนุมัติ</div>
      ) : (
        <div className="space-y-4">
          {requisitions.map((req) => (
            <div key={req.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50" onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}>
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-medium">{req.requisitionNumber}</span>
                    <span className="text-gray-500">{req.department?.nameTh}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {req.requestedBy.firstName} {req.requestedBy.lastName} | {formatDate(req.requestedDate)} | {req.items.length} รายการ
                    {req.purpose && ` | ${req.purpose}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {req.status === "Pending" && (
                    <>
                      <button onClick={(e) => { e.stopPropagation(); handleApprove(req); }} disabled={processing === req.id}
                        className="flex items-center gap-1 bg-green-600 text-white rounded-lg px-3 py-1.5 text-sm hover:bg-green-700 disabled:opacity-50">
                        <CheckCircle className="w-4 h-4" /> อนุมัติ
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleReject(req.id); }} disabled={processing === req.id}
                        className="flex items-center gap-1 bg-red-600 text-white rounded-lg px-3 py-1.5 text-sm hover:bg-red-700 disabled:opacity-50">
                        <XCircle className="w-4 h-4" /> ไม่อนุมัติ
                      </button>
                    </>
                  )}
                  {req.status === "Approved" && (
                    <button onClick={(e) => { e.stopPropagation(); handleDisburse(req.id); }} disabled={processing === req.id}
                      className="flex items-center gap-1 bg-purple-600 text-white rounded-lg px-3 py-1.5 text-sm hover:bg-purple-700 disabled:opacity-50">
                      <PackageMinus className="w-4 h-4" /> เบิกจ่าย
                    </button>
                  )}
                </div>
              </div>
              {expandedId === req.id && (
                <div className="border-t border-gray-200 p-4">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b">
                      <th className="text-left py-2 text-gray-500">รหัส</th>
                      <th className="text-left py-2 text-gray-500">ชื่อพัสดุ</th>
                      <th className="text-right py-2 text-gray-500">จำนวนที่เบิก</th>
                      <th className="text-left py-2 text-gray-500">หน่วย</th>
                    </tr></thead>
                    <tbody>
                      {req.items.map((item) => (
                        <tr key={item.id} className="border-b border-gray-50">
                          <td className="py-2 font-mono text-xs">{item.supplyItem.code}</td>
                          <td className="py-2">{item.supplyItem.nameTh}</td>
                          <td className="py-2 text-right font-medium">{item.requestedQty}</td>
                          <td className="py-2 text-gray-500">{item.supplyItem.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
