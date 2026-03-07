"use client";

import { useEffect, useState, useCallback } from "react";
import { ClipboardList, Plus, Search, X, RefreshCw } from "lucide-react";

interface Patient {
  id: string;
  hn: string;
  title: string;
  firstNameTh: string;
  lastNameTh: string;
  phone: string;
}

interface QueueItem {
  id: string;
  queueNumber: string;
  queueType: string;
  priority: string;
  currentStation: string;
  calledAt: string | null;
  completedAt: string | null;
  createdAt: string;
  patient: Patient;
}

const STATIONS = [
  { key: "WaitScreening", label: "รอคัดกรอง", color: "border-yellow-400 bg-yellow-50" },
  { key: "Screening", label: "กำลังคัดกรอง", color: "border-blue-400 bg-blue-50" },
  { key: "WaitDoctor", label: "รอพบแพทย์", color: "border-orange-400 bg-orange-50" },
  { key: "WithDoctor", label: "กำลังตรวจ", color: "border-purple-400 bg-purple-50" },
  { key: "WaitPharmacy", label: "รอรับยา", color: "border-cyan-400 bg-cyan-50" },
  { key: "WaitPayment", label: "รอชำระเงิน", color: "border-pink-400 bg-pink-50" },
];

const ALL_STATIONS = [
  { key: "WaitScreening", label: "รอคัดกรอง" },
  { key: "Screening", label: "กำลังคัดกรอง" },
  { key: "WaitDoctor", label: "รอพบแพทย์" },
  { key: "WithDoctor", label: "กำลังตรวจ" },
  { key: "WaitPharmacy", label: "รอรับยา" },
  { key: "WaitPayment", label: "รอชำระเงิน" },
  { key: "Completed", label: "เสร็จสิ้น" },
];

export default function QueuePage() {
  const [queues, setQueues] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showStationModal, setShowStationModal] = useState<QueueItem | null>(null);

  // Modal form state
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [queueType, setQueueType] = useState("WalkIn");
  const [priority, setPriority] = useState("Normal");
  const [submitting, setSubmitting] = useState(false);

  const fetchQueues = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/queue");
      const data = await res.json();
      setQueues(Array.isArray(data) ? data : []);
    } catch {
      console.error("Failed to fetch queues");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueues();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchQueues, 30000);
    return () => clearInterval(interval);
  }, [fetchQueues]);

  // Search patients
  useEffect(() => {
    if (!patientSearch || patientSearch.length < 1) return;
    const timeout = setTimeout(() => {
      fetch(`/api/patients?q=${encodeURIComponent(patientSearch)}`)
        .then((r) => r.json())
        .then((d) => {
          setPatients(Array.isArray(d) ? d : []);
          setShowPatientDropdown(true);
        })
        .catch(() => {});
    }, 300);
    return () => clearTimeout(timeout);
  }, [patientSearch]);

  const handleCreateQueue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: selectedPatient.id,
          queueType,
          priority,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        resetForm();
        fetchQueues();
      }
    } catch {
      console.error("Failed to create queue");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStationChange = async (queueId: string, newStation: string) => {
    try {
      await fetch("/api/queue", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: queueId, currentStation: newStation }),
      });
      setShowStationModal(null);
      fetchQueues();
    } catch {
      console.error("Failed to update station");
    }
  };

  const resetForm = () => {
    setSelectedPatient(null);
    setPatientSearch("");
    setQueueType("WalkIn");
    setPriority("Normal");
  };

  const completedCount = queues.filter((q) => q.currentStation === "Completed").length;
  const activeCount = queues.filter((q) => q.currentStation !== "Completed").length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">จัดการคิว</h1>
          <p className="text-sm text-gray-500 mt-1">
            คิวรอ: {activeCount} | เสร็จสิ้น: {completedCount} | ทั้งหมด: {queues.length}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchQueues}
            className="flex items-center gap-2 bg-gray-100 text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-200 transition text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            รีเฟรช
          </button>
          <button
            onClick={() => {
              fetch("/api/patients?q=")
                .then((r) => r.json())
                .then((d) => setPatients(Array.isArray(d) ? d : []))
                .catch(() => {});
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            รับคิวใหม่
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div className="py-12 text-center text-gray-500">กำลังโหลด...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {STATIONS.map((station) => {
            const stationQueues = queues.filter((q) => q.currentStation === station.key);
            return (
              <div
                key={station.key}
                className={`rounded-xl border-t-4 ${station.color} bg-white shadow-sm border border-gray-200`}
              >
                <div className="p-3 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700">{station.label}</h3>
                  <p className="text-xs text-gray-400">{stationQueues.length} คิว</p>
                </div>
                <div className="p-2 space-y-2 min-h-[120px]">
                  {stationQueues.map((q) => (
                    <div
                      key={q.id}
                      onClick={() => setShowStationModal(q)}
                      className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-bold text-blue-600 text-lg">
                          {q.queueNumber}
                        </span>
                        {q.priority === "Urgent" && (
                          <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-medium">
                            เร่งด่วน
                          </span>
                        )}
                        {q.priority === "Emergency" && (
                          <span className="px-1.5 py-0.5 bg-red-500 text-white rounded text-[10px] font-medium">
                            ฉุกเฉิน
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-700 truncate">
                        {q.patient.title}
                        {q.patient.firstNameTh} {q.patient.lastNameTh}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {q.queueType === "WalkIn" ? "Walk-in" : "นัดหมาย"}
                      </p>
                    </div>
                  ))}
                  {stationQueues.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-4">ว่าง</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Completed section */}
      {completedCount > 0 && (
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            <ClipboardList className="w-4 h-4 inline mr-1" />
            เสร็จสิ้นวันนี้ ({completedCount})
          </h3>
          <div className="flex flex-wrap gap-2">
            {queues
              .filter((q) => q.currentStation === "Completed")
              .map((q) => (
                <div
                  key={q.id}
                  className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm"
                >
                  <span className="font-mono font-bold text-green-700">{q.queueNumber}</span>
                  <span className="ml-2 text-gray-600">
                    {q.patient.title}
                    {q.patient.firstNameTh}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Create Queue Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">รับคิวใหม่</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleCreateQueue} className="space-y-4">
              {/* Patient Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ผู้ป่วย <span className="text-red-500">*</span>
                </label>
                {selectedPatient ? (
                  <div className="flex items-center justify-between border border-gray-300 rounded-lg px-3 py-2 bg-blue-50">
                    <div>
                      <span className="font-medium text-gray-900">
                        {selectedPatient.title}
                        {selectedPatient.firstNameTh} {selectedPatient.lastNameTh}
                      </span>
                      <span className="ml-2 text-sm text-blue-600 font-mono">
                        ({selectedPatient.hn})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPatient(null);
                        setPatientSearch("");
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2">
                      <Search className="w-4 h-4 text-gray-400 mr-2" />
                      <input
                        type="text"
                        value={patientSearch}
                        onChange={(e) => setPatientSearch(e.target.value)}
                        onFocus={() => setShowPatientDropdown(true)}
                        placeholder="ค้นหาชื่อ, HN, เบอร์โทร..."
                        className="w-full outline-none text-sm"
                      />
                    </div>
                    {showPatientDropdown && patients.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {patients.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setSelectedPatient(p);
                              setShowPatientDropdown(false);
                              setPatientSearch("");
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm flex items-center justify-between"
                          >
                            <span>
                              {p.title}
                              {p.firstNameTh} {p.lastNameTh}
                            </span>
                            <span className="text-blue-600 font-mono text-xs">{p.hn}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Queue Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ประเภท</label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="queueType"
                      value="WalkIn"
                      checked={queueType === "WalkIn"}
                      onChange={(e) => setQueueType(e.target.value)}
                      className="text-blue-600"
                    />
                    <span className="text-sm">Walk-in</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="queueType"
                      value="Appointment"
                      checked={queueType === "Appointment"}
                      onChange={(e) => setQueueType(e.target.value)}
                      className="text-blue-600"
                    />
                    <span className="text-sm">นัดหมาย</span>
                  </label>
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ความเร่งด่วน</label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="priority"
                      value="Normal"
                      checked={priority === "Normal"}
                      onChange={(e) => setPriority(e.target.value)}
                      className="text-blue-600"
                    />
                    <span className="text-sm">ปกติ</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="priority"
                      value="Urgent"
                      checked={priority === "Urgent"}
                      onChange={(e) => setPriority(e.target.value)}
                      className="text-red-600"
                    />
                    <span className="text-sm text-red-600">เร่งด่วน</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="priority"
                      value="Emergency"
                      checked={priority === "Emergency"}
                      onChange={(e) => setPriority(e.target.value)}
                      className="text-red-600"
                    />
                    <span className="text-sm text-red-700 font-medium">ฉุกเฉิน</span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedPatient}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {submitting ? "กำลังสร้าง..." : "รับคิว"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Station Change Modal */}
      {showStationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">ย้ายสถานี</h2>
              <button
                onClick={() => setShowStationModal(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="mb-4 bg-blue-50 rounded-lg p-3">
              <p className="font-mono font-bold text-blue-600 text-xl">
                {showStationModal.queueNumber}
              </p>
              <p className="text-sm text-gray-700">
                {showStationModal.patient.title}
                {showStationModal.patient.firstNameTh} {showStationModal.patient.lastNameTh}
              </p>
            </div>

            <div className="space-y-2">
              {ALL_STATIONS.map((station) => (
                <button
                  key={station.key}
                  onClick={() => handleStationChange(showStationModal.id, station.key)}
                  disabled={showStationModal.currentStation === station.key}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition ${
                    showStationModal.currentStation === station.key
                      ? "bg-blue-100 text-blue-800 font-medium border border-blue-300"
                      : "bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200"
                  }`}
                >
                  {station.label}
                  {showStationModal.currentStation === station.key && (
                    <span className="ml-2 text-xs">(ปัจจุบัน)</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
