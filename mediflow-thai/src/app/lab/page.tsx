"use client";

import { useEffect, useState, useCallback } from "react";
import {
  FlaskConical,
  ClipboardCheck,
  Loader2,
  Search,
  Send,
  X,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

interface Patient {
  hn: string;
  title: string;
  firstNameTh: string;
  lastNameTh: string;
}

interface Doctor {
  firstName: string;
  lastName: string;
}

interface LabTest {
  nameTh: string;
  nameEn: string;
  unit: string;
  normalRange: string;
  category: string;
}

interface LabResult {
  id: string;
  resultValue: string;
  resultUnit: string;
  normalRange: string;
  isAbnormal: boolean;
  interpretation: string;
  performedBy: { firstName: string; lastName: string };
  verifiedBy: { firstName: string; lastName: string } | null;
  resultAt: string;
}

interface LabOrder {
  id: string;
  visitId: string;
  patientId: string;
  status: string;
  priority: string;
  notes: string;
  orderedAt: string;
  patient: Patient;
  doctor: Doctor;
  labTest: LabTest;
  labResult: LabResult | null;
}

const STATUS_LABELS: Record<string, string> = {
  Pending: "รอดำเนินการ",
  Processing: "กำลังตรวจ",
  Completed: "เสร็จสิ้น",
};

const STATUS_COLORS: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-700",
  Processing: "bg-blue-100 text-blue-700",
  Completed: "bg-green-100 text-green-700",
};

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function LabPage() {
  const [labOrders, setLabOrders] = useState<LabOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"orders" | "results">("orders");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Result entry state
  const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null);
  const [resultValue, setResultValue] = useState("");
  const [resultUnit, setResultUnit] = useState("");
  const [normalRange, setNormalRange] = useState("");
  const [isAbnormal, setIsAbnormal] = useState(false);
  const [interpretation, setInterpretation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const fetchOrders = useCallback(async () => {
    try {
      const statusParam =
        filterStatus !== "all" ? `?status=${filterStatus}` : "";
      const res = await fetch(`/api/lab${statusParam}`);
      if (res.ok) {
        const data: LabOrder[] = await res.json();
        setLabOrders(data);
      }
    } catch {
      console.error("Failed to fetch lab orders");
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    setLoading(true);
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = labOrders.filter((order) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      order.patient.firstNameTh.toLowerCase().includes(q) ||
      order.patient.lastNameTh.toLowerCase().includes(q) ||
      order.patient.hn.toLowerCase().includes(q) ||
      order.labTest.nameTh.toLowerCase().includes(q)
    );
  });

  const pendingCount = labOrders.filter((o) => o.status === "Pending").length;
  const processingCount = labOrders.filter(
    (o) => o.status === "Processing"
  ).length;
  const completedCount = labOrders.filter(
    (o) => o.status === "Completed"
  ).length;

  const pendingOrders = filteredOrders.filter(
    (o) => o.status === "Pending" || o.status === "Processing"
  );

  const selectOrderForEntry = (order: LabOrder) => {
    setSelectedOrder(order);
    setResultValue(order.labResult?.resultValue || "");
    setResultUnit(
      order.labResult?.resultUnit || order.labTest.unit || ""
    );
    setNormalRange(
      order.labResult?.normalRange || order.labTest.normalRange || ""
    );
    setIsAbnormal(order.labResult?.isAbnormal || false);
    setInterpretation(order.labResult?.interpretation || "");
    setActiveTab("results");
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleSubmitResult = async () => {
    if (!selectedOrder) return;
    if (!resultValue.trim()) {
      setErrorMessage("กรุณากรอกผลตรวจ");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      // Use a mock performedById - in real app this would come from auth context
      const res = await fetch("/api/lab", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          labOrderId: selectedOrder.id,
          resultValue,
          resultUnit,
          normalRange,
          isAbnormal,
          interpretation,
          performedById: selectedOrder.doctor.firstName ? selectedOrder.patientId : selectedOrder.patientId, // placeholder
          status: "Completed",
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "บันทึกผลไม่สำเร็จ");
      }

      setSuccessMessage("บันทึกผลตรวจสำเร็จ");
      setSelectedOrder(null);
      setResultValue("");
      setResultUnit("");
      setNormalRange("");
      setIsAbnormal(false);
      setInterpretation("");

      // Refresh orders
      await fetchOrders();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "เกิดข้อผิดพลาด"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const cancelEntry = () => {
    setSelectedOrder(null);
    setResultValue("");
    setResultUnit("");
    setNormalRange("");
    setIsAbnormal(false);
    setInterpretation("");
    setErrorMessage("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ผลตรวจ Lab</h1>
        <p className="text-sm text-gray-500 mt-1">
          รอดำเนินการ:{" "}
          <span className="font-semibold text-yellow-600">{pendingCount}</span>
          {" | "}กำลังตรวจ:{" "}
          <span className="font-semibold text-blue-600">{processingCount}</span>
          {" | "}เสร็จสิ้น:{" "}
          <span className="font-semibold text-green-600">{completedCount}</span>
        </p>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex items-center gap-2 text-sm text-green-700">
          <CheckCircle className="w-4 h-4" />
          {successMessage}
        </div>
      )}
      {errorMessage && !selectedOrder && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center gap-2 text-sm text-red-700">
          <AlertTriangle className="w-4 h-4" />
          {errorMessage}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab("orders")}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition ${
                activeTab === "orders"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <FlaskConical className="w-4 h-4" />
              รายการคำสั่งตรวจ
            </button>
            <button
              onClick={() => setActiveTab("results")}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition ${
                activeTab === "results"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <ClipboardCheck className="w-4 h-4" />
              บันทึกผล Lab
              {pendingOrders.length > 0 && (
                <span className="ml-1 bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs font-medium">
                  {pendingOrders.length}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Tab 1: Orders List */}
          {activeTab === "orders" && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ค้นหาชื่อผู้ป่วย, HN, หรือรายการตรวจ..."
                    className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex gap-2">
                  {["all", "Pending", "Processing", "Completed"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setFilterStatus(s)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition ${
                        filterStatus === s
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {s === "all"
                        ? "ทั้งหมด"
                        : STATUS_LABELS[s] || s}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                  <span className="ml-2 text-gray-500">กำลังโหลด...</span>
                </div>
              ) : filteredOrders.length === 0 ? (
                <p className="text-gray-400 text-center py-8">
                  ไม่มีรายการตรวจ Lab
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-gray-500">
                      <th className="pb-3 font-medium">วันที่สั่ง</th>
                      <th className="pb-3 font-medium">ผู้ป่วย</th>
                      <th className="pb-3 font-medium">HN</th>
                      <th className="pb-3 font-medium">รายการตรวจ</th>
                      <th className="pb-3 font-medium">แพทย์สั่ง</th>
                      <th className="pb-3 font-medium">Priority</th>
                      <th className="pb-3 font-medium">สถานะ</th>
                      <th className="pb-3 font-medium">ผลตรวจ</th>
                      <th className="pb-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3">
                          {formatDateTime(order.orderedAt)}
                        </td>
                        <td className="py-3 font-medium">
                          {order.patient.firstNameTh}{" "}
                          {order.patient.lastNameTh}
                        </td>
                        <td className="py-3 text-gray-500">
                          {order.patient.hn}
                        </td>
                        <td className="py-3">{order.labTest.nameTh}</td>
                        <td className="py-3">{order.doctor.firstName}</td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              order.priority === "Urgent"
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {order.priority === "Urgent"
                              ? "เร่งด่วน"
                              : "ปกติ"}
                          </span>
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              STATUS_COLORS[order.status] ||
                              "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {STATUS_LABELS[order.status] || order.status}
                          </span>
                        </td>
                        <td className="py-3">
                          {order.labResult ? (
                            <span
                              className={`font-medium ${
                                order.labResult.isAbnormal
                                  ? "text-red-600"
                                  : "text-green-600"
                              }`}
                            >
                              {order.labResult.resultValue}{" "}
                              {order.labResult.resultUnit}
                              {order.labResult.isAbnormal && (
                                <AlertTriangle className="w-3 h-3 inline ml-1" />
                              )}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3">
                          {(order.status === "Pending" ||
                            order.status === "Processing") && (
                            <button
                              onClick={() => selectOrderForEntry(order)}
                              className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition font-medium"
                            >
                              บันทึกผล
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Tab 2: Enter Results */}
          {activeTab === "results" && (
            <div className="space-y-4">
              {!selectedOrder ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">
                    เลือกรายการที่ต้องการบันทึกผล หรือคลิก
                    &quot;บันทึกผล&quot; จากแท็บรายการคำสั่งตรวจ
                  </p>

                  {/* Pending orders list for quick selection */}
                  {pendingOrders.length === 0 ? (
                    <div className="text-center py-12">
                      <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
                      <p className="text-gray-400">
                        ไม่มีรายการรอบันทึกผล
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-gray-700">
                        รายการรอบันทึกผล ({pendingOrders.length})
                      </h3>
                      {pendingOrders.map((order) => (
                        <div
                          key={order.id}
                          onClick={() => selectOrderForEntry(order)}
                          className="flex items-center justify-between border border-gray-200 rounded-lg p-4 hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <span className="font-medium text-gray-900">
                                {order.patient.title}
                                {order.patient.firstNameTh}{" "}
                                {order.patient.lastNameTh}
                              </span>
                              <span className="text-xs text-gray-400">
                                HN: {order.patient.hn}
                              </span>
                              {order.priority === "Urgent" && (
                                <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">
                                  เร่งด่วน
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                              <span>{order.labTest.nameTh}</span>
                              <span>|</span>
                              <span>สั่งโดย {order.doctor.firstName}</span>
                              <span>|</span>
                              <span>
                                {formatDateTime(order.orderedAt)}
                              </span>
                            </div>
                          </div>
                          <span
                            className={`px-2.5 py-1 rounded text-xs font-medium ${
                              STATUS_COLORS[order.status] || ""
                            }`}
                          >
                            {STATUS_LABELS[order.status] || order.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Selected Order Header */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-blue-900">
                          บันทึกผลตรวจ: {selectedOrder.labTest.nameTh}
                        </h3>
                        <p className="text-sm text-blue-700 mt-1">
                          ผู้ป่วย: {selectedOrder.patient.title}
                          {selectedOrder.patient.firstNameTh}{" "}
                          {selectedOrder.patient.lastNameTh} (HN:{" "}
                          {selectedOrder.patient.hn})
                        </p>
                        <p className="text-xs text-blue-600 mt-0.5">
                          สั่งโดย: {selectedOrder.doctor.firstName}{" "}
                          {selectedOrder.doctor.lastName} |{" "}
                          {formatDateTime(selectedOrder.orderedAt)}
                        </p>
                      </div>
                      <button
                        onClick={cancelEntry}
                        className="p-2 rounded-lg hover:bg-blue-100 transition"
                      >
                        <X className="w-5 h-5 text-blue-600" />
                      </button>
                    </div>
                    {selectedOrder.notes && (
                      <p className="text-xs text-blue-700 mt-2 bg-blue-100 rounded px-2 py-1">
                        หมายเหตุ: {selectedOrder.notes}
                      </p>
                    )}
                  </div>

                  {/* Error in form */}
                  {errorMessage && (
                    <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center gap-2 text-sm text-red-700">
                      <AlertTriangle className="w-4 h-4" />
                      {errorMessage}
                    </div>
                  )}

                  {/* Result Entry Form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ผลตรวจ *
                      </label>
                      <input
                        type="text"
                        value={resultValue}
                        onChange={(e) => setResultValue(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="กรอกค่าผลตรวจ..."
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        หน่วย
                      </label>
                      <input
                        type="text"
                        value={resultUnit}
                        onChange={(e) => setResultUnit(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder={
                          selectedOrder.labTest.unit || "เช่น mg/dL"
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ค่าปกติ (Normal Range)
                      </label>
                      <input
                        type="text"
                        value={normalRange}
                        onChange={(e) => setNormalRange(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder={
                          selectedOrder.labTest.normalRange ||
                          "เช่น 70-110"
                        }
                      />
                    </div>

                    <div className="flex items-end">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isAbnormal}
                          onChange={(e) => setIsAbnormal(e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                        <span className="text-sm font-medium text-red-600">
                          ผลผิดปกติ (Abnormal)
                        </span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      การแปลผล (Interpretation)
                    </label>
                    <textarea
                      value={interpretation}
                      onChange={(e) => setInterpretation(e.target.value)}
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="หมายเหตุหรือการแปลผลเพิ่มเติม..."
                    />
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={cancelEntry}
                      className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={handleSubmitResult}
                      disabled={submitting}
                      className="flex items-center gap-2 bg-blue-600 text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      ส่งผลตรวจ
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
