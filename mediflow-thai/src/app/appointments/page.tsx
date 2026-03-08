"use client";

import { useEffect, useState, useCallback } from "react";
import { Calendar, Plus, Search, X, Check, LogIn, Ban, RefreshCw } from "lucide-react";

interface Patient {
  id: string;
  hn: string;
  title: string;
  firstNameTh: string;
  lastNameTh: string;
  phone: string;
}

interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  specialization: string;
}

interface Service {
  id: string;
  nameTh: string;
  price: number;
  durationMinutes: number;
}

interface Appointment {
  id: string;
  appointmentDate: string;
  appointmentTime: string;
  durationMinutes: number;
  status: string;
  notes: string;
  patient: Patient;
  doctor: Doctor;
  service: Service | null;
}

const STATUS_LABELS: Record<string, string> = {
  Scheduled: "นัดแล้ว",
  Confirmed: "ยืนยัน",
  CheckedIn: "มาถึง",
  Completed: "เสร็จสิ้น",
  Cancelled: "ยกเลิก",
  NoShow: "ไม่มา",
};

const STATUS_COLORS: Record<string, string> = {
  Scheduled: "bg-blue-100 text-blue-800",
  Confirmed: "bg-green-100 text-green-800",
  CheckedIn: "bg-yellow-100 text-yellow-800",
  Completed: "bg-emerald-100 text-emerald-800",
  Cancelled: "bg-red-100 text-red-700",
  NoShow: "bg-gray-200 text-gray-600",
};

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Filters
  const [filterDate, setFilterDate] = useState("");
  const [filterDoctor, setFilterDoctor] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Modal form state
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [formData, setFormData] = useState({
    doctorId: "",
    serviceId: "",
    appointmentDate: "",
    appointmentTime: "09:00",
    durationMinutes: 15,
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterDate) params.set("date", filterDate);
      if (filterDoctor) params.set("doctorId", filterDoctor);
      if (filterStatus) params.set("status", filterStatus);

      const res = await fetch(`/api/appointments?${params.toString()}`);
      const data = await res.json();
      setAppointments(Array.isArray(data) ? data : []);
    } catch {
      console.error("Failed to fetch appointments");
    } finally {
      setLoading(false);
    }
  }, [filterDate, filterDoctor, filterStatus]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Fetch doctors and services on mount
  useEffect(() => {
    fetch("/api/patients?q=")
      .then((r) => r.json())
      .then((d) => setPatients(Array.isArray(d) ? d : []))
      .catch(() => {});

    fetch("/api/settings/users")
      .then((r) => r.json())
      .then((d) => {
        const docs = (Array.isArray(d) ? d : []).filter(
          (u: Doctor & { role: string }) => u.role === "Doctor"
        );
        setDoctors(docs);
      })
      .catch(() => {});

    // Try to get services from clinic settings
    fetch("/api/patients?q=__services__")
      .then(() => {
        // Fallback: fetch services via a direct approach
      })
      .catch(() => {});
  }, []);

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

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch("/api/appointments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      fetchAppointments();
    } catch {
      console.error("Failed to update status");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !formData.doctorId || !formData.appointmentDate) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: selectedPatient.id,
          ...formData,
          serviceId: formData.serviceId || null,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        resetForm();
        fetchAppointments();
      }
    } catch {
      console.error("Failed to create appointment");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedPatient(null);
    setPatientSearch("");
    setFormData({
      doctorId: "",
      serviceId: "",
      appointmentDate: "",
      appointmentTime: "09:00",
      durationMinutes: 15,
      notes: "",
    });
  };

  const openModal = () => {
    // Fetch services when modal opens
    fetch("/api/patients?q=")
      .then((r) => r.json())
      .then((d) => setPatients(Array.isArray(d) ? d : []))
      .catch(() => {});
    setShowModal(true);
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const todayCount = appointments.filter((a) => {
    const d = new Date(a.appointmentDate).toISOString().split("T")[0];
    return d === todayStr;
  }).length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">นัดหมาย</h1>
          <p className="text-sm text-gray-500 mt-1">
            นัดหมายวันนี้: {todayCount} รายการ | ทั้งหมด: {appointments.length} รายการ
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg text-blue-700">
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-medium">{formatDate(new Date())}</span>
          </div>
          <button
            onClick={openModal}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            สร้างนัดหมาย
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">วันที่:</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">แพทย์:</label>
            <select
              value={filterDoctor}
              onChange={(e) => setFilterDoctor(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
            >
              <option value="">ทั้งหมด</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.firstName} {d.lastName}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">สถานะ:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
            >
              <option value="">ทั้งหมด</option>
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => {
              setFilterDate("");
              setFilterDoctor("");
              setFilterStatus("");
            }}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            ล้างตัวกรอง
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {loading ? (
          <div className="py-12 text-center text-gray-500">กำลังโหลด...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 font-medium text-gray-500">วันที่</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">เวลา</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">ผู้ป่วย</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">HN</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">แพทย์</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">บริการ</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">สถานะ</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((a) => (
                <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">{formatDate(a.appointmentDate)}</td>
                  <td className="py-3 px-4 font-mono">{a.appointmentTime}</td>
                  <td className="py-3 px-4 font-medium">
                    {a.patient.title}
                    {a.patient.firstNameTh} {a.patient.lastNameTh}
                  </td>
                  <td className="py-3 px-4 font-mono text-blue-600">{a.patient.hn}</td>
                  <td className="py-3 px-4">
                    {a.doctor.firstName} {a.doctor.lastName}
                  </td>
                  <td className="py-3 px-4">{a.service?.nameTh || "-"}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        STATUS_COLORS[a.status] || "bg-gray-100"
                      }`}
                    >
                      {STATUS_LABELS[a.status] || a.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      {a.status === "Scheduled" && (
                        <button
                          onClick={() => updateStatus(a.id, "Confirmed")}
                          className="p-1.5 bg-green-50 text-green-600 rounded hover:bg-green-100 transition"
                          title="ยืนยัน"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {(a.status === "Scheduled" || a.status === "Confirmed") && (
                        <button
                          onClick={() => updateStatus(a.id, "CheckedIn")}
                          className="p-1.5 bg-yellow-50 text-yellow-600 rounded hover:bg-yellow-100 transition"
                          title="เช็คอิน"
                        >
                          <LogIn className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {a.status !== "Cancelled" && a.status !== "Completed" && (
                        <button
                          onClick={() => updateStatus(a.id, "Cancelled")}
                          className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 transition"
                          title="ยกเลิก"
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {appointments.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500">
                    ไม่มีนัดหมาย
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Appointment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">สร้างนัดหมายใหม่</h2>
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

            <form onSubmit={handleSubmit} className="space-y-4">
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

              {/* Doctor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  แพทย์ <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.doctorId}
                  onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  required
                >
                  <option value="">-- เลือกแพทย์ --</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.firstName} {d.lastName}
                      {d.specialization ? ` (${d.specialization})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Service */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">บริการ</label>
                <select
                  value={formData.serviceId}
                  onChange={(e) => {
                    const svc = services.find((s) => s.id === e.target.value);
                    setFormData({
                      ...formData,
                      serviceId: e.target.value,
                      durationMinutes: svc?.durationMinutes || 15,
                    });
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">-- เลือกบริการ (ไม่บังคับ) --</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nameTh} ({s.durationMinutes} นาที)
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    วันที่ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.appointmentDate}
                    onChange={(e) =>
                      setFormData({ ...formData, appointmentDate: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    เวลา <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.appointmentTime}
                    onChange={(e) =>
                      setFormData({ ...formData, appointmentTime: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    required
                  />
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ระยะเวลา (นาที)
                </label>
                <select
                  value={formData.durationMinutes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      durationMinutes: parseInt(e.target.value),
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value={15}>15 นาที</option>
                  <option value={30}>30 นาที</option>
                  <option value={45}>45 นาที</option>
                  <option value={60}>60 นาที</option>
                  <option value={90}>90 นาที</option>
                  <option value={120}>120 นาที</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  หมายเหตุ
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  rows={3}
                  placeholder="หมายเหตุเพิ่มเติม..."
                />
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
                  disabled={submitting || !selectedPatient || !formData.doctorId}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {submitting ? "กำลังบันทึก..." : "สร้างนัดหมาย"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
