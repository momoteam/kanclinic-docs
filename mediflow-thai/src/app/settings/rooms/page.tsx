"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  DoorOpen,
  Plus,
  X,
  Loader2,
  Edit2,
  UserCircle,
} from "lucide-react";

interface DoctorRef {
  id: string;
  firstName: string;
  lastName: string;
  specialization?: string;
}

interface RoomData {
  id: string;
  roomNumber: string;
  roomName: string;
  roomType: string;
  assignedDoctorId: string | null;
  assignedDoctor: DoctorRef | null;
  status: string;
}

const ROOM_TYPES = [
  { value: "", label: "-- เลือกประเภท --" },
  { value: "General", label: "ห้องตรวจทั่วไป" },
  { value: "Specialist", label: "ห้องตรวจเฉพาะทาง" },
  { value: "Procedure", label: "ห้องหัตถการ" },
  { value: "Screening", label: "ห้องคัดกรอง" },
  { value: "Emergency", label: "ห้องฉุกเฉิน" },
  { value: "Lab", label: "ห้องแล็บ" },
];

const STATUS_OPTIONS = [
  { value: "Available", label: "ว่าง", color: "bg-green-100 text-green-700 border-green-200" },
  { value: "Occupied", label: "ใช้งาน", color: "bg-red-100 text-red-700 border-red-200" },
  { value: "Closed", label: "ปิด", color: "bg-gray-100 text-gray-500 border-gray-200" },
];

const STATUS_COLORS: Record<string, string> = {
  Available: "border-green-200 bg-green-50",
  Occupied: "border-red-200 bg-red-50",
  Closed: "border-gray-200 bg-gray-50",
};

const STATUS_BADGE: Record<string, string> = {
  Available: "bg-green-100 text-green-700",
  Occupied: "bg-red-100 text-red-700",
  Closed: "bg-gray-100 text-gray-500",
};

const STATUS_LABELS: Record<string, string> = {
  Available: "ว่าง",
  Occupied: "ใช้งาน",
  Closed: "ปิด",
};

const EMPTY_FORM = {
  roomNumber: "",
  roomName: "",
  roomType: "",
  assignedDoctorId: "",
  status: "Available",
};

export default function RoomsSettingsPage() {
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [doctors, setDoctors] = useState<DoctorRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<RoomData | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchRooms = async () => {
    try {
      const res = await fetch("/api/settings/rooms");
      const data = await res.json();
      setRooms(data.rooms);
      setDoctors(data.doctors);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const openAdd = () => {
    setEditingRoom(null);
    setForm(EMPTY_FORM);
    setError("");
    setShowModal(true);
  };

  const openEdit = (room: RoomData) => {
    setEditingRoom(room);
    setForm({
      roomNumber: room.roomNumber,
      roomName: room.roomName,
      roomType: room.roomType,
      assignedDoctorId: room.assignedDoctorId || "",
      status: room.status,
    });
    setError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.roomNumber) {
      setError("กรุณากรอกหมายเลขห้อง");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const method = editingRoom ? "PUT" : "POST";
      const payload = editingRoom ? { id: editingRoom.id, ...form } : form;
      const res = await fetch("/api/settings/rooms", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "เกิดข้อผิดพลาด");
        return;
      }

      setShowModal(false);
      fetchRooms();
    } catch {
      setError("ไม่สามารถบันทึกข้อมูลได้");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/settings"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="flex items-center gap-2">
            <DoorOpen className="w-6 h-6 text-orange-600" />
            <h1 className="text-2xl font-bold text-gray-900">ห้องตรวจ</h1>
          </div>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          เพิ่มห้องตรวจ
        </button>
      </div>

      {/* Room Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : rooms.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-10 text-center">
          <DoorOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">ยังไม่มีห้องตรวจในระบบ</p>
          <button
            onClick={openAdd}
            className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            + เพิ่มห้องตรวจแรก
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <div
              key={room.id}
              className={`bg-white rounded-xl shadow-sm border-2 p-5 transition-all hover:shadow-md ${STATUS_COLORS[room.status] || "border-gray-200"}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-gray-900">
                      {room.roomName || room.roomNumber}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    ห้อง {room.roomNumber}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[room.status] || "bg-gray-100"}`}
                  >
                    {STATUS_LABELS[room.status] || room.status}
                  </span>
                  <button
                    onClick={() => openEdit(room)}
                    className="p-1.5 hover:bg-white/80 rounded-lg transition-colors"
                    title="แก้ไข"
                  >
                    <Edit2 className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>

              {room.roomType && (
                <p className="text-xs text-gray-500 mb-2">
                  ประเภท:{" "}
                  {ROOM_TYPES.find((t) => t.value === room.roomType)?.label ||
                    room.roomType}
                </p>
              )}

              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                <UserCircle className="w-4 h-4 text-gray-400" />
                {room.assignedDoctor ? (
                  <span className="text-sm text-gray-700">
                    นพ.{room.assignedDoctor.firstName}{" "}
                    {room.assignedDoctor.lastName}
                  </span>
                ) : (
                  <span className="text-sm text-gray-400">
                    ไม่มีแพทย์ประจำ
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingRoom ? "แก้ไขห้องตรวจ" : "เพิ่มห้องตรวจใหม่"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    หมายเลขห้อง <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.roomNumber}
                    onChange={(e) =>
                      setForm({ ...form, roomNumber: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="101"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อห้อง
                  </label>
                  <input
                    value={form.roomName}
                    onChange={(e) =>
                      setForm({ ...form, roomName: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="ห้องตรวจ 1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ประเภทห้อง
                </label>
                <select
                  value={form.roomType}
                  onChange={(e) =>
                    setForm({ ...form, roomType: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  {ROOM_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  แพทย์ประจำห้อง
                </label>
                <select
                  value={form.assignedDoctorId}
                  onChange={(e) =>
                    setForm({ ...form, assignedDoctorId: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="">-- ไม่ระบุ --</option>
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      นพ.{doc.firstName} {doc.lastName}
                      {doc.specialization ? ` (${doc.specialization})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  สถานะ
                </label>
                <div className="flex gap-3">
                  {STATUS_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
                        form.status === opt.value
                          ? opt.color + " border-current"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="status"
                        value={opt.value}
                        checked={form.status === opt.value}
                        onChange={(e) =>
                          setForm({ ...form, status: e.target.value })
                        }
                        className="sr-only"
                      />
                      <span className="text-sm font-medium">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingRoom ? "บันทึก" : "เพิ่มห้องตรวจ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
