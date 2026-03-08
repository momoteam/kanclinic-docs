import { prisma } from "@/lib/prisma";
import { DoorOpen, UserCheck, Clock, Users } from "lucide-react";

export const dynamic = "force-dynamic";

const ROOM_STATUS_LABELS: Record<string, string> = {
  Available: "ว่าง",
  Occupied: "กำลังใช้งาน",
  Closed: "ปิดใช้งาน",
};

const ROOM_STATUS_COLORS: Record<string, string> = {
  Available: "bg-green-100 text-green-700 border-green-200",
  Occupied: "bg-red-100 text-red-700 border-red-200",
  Closed: "bg-gray-100 text-gray-500 border-gray-200",
};

const ROOM_BORDER_COLORS: Record<string, string> = {
  Available: "border-l-green-500",
  Occupied: "border-l-red-500",
  Closed: "border-l-gray-400",
};

export default async function ExaminationRoomsPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const rooms = await prisma.examinationRoom.findMany({
    include: {
      assignedDoctor: true,
      queues: {
        where: {
          queueDate: { gte: today, lt: tomorrow },
          currentStation: { in: ["WaitDoctor", "WithDoctor"] },
        },
        include: { patient: true },
      },
    },
    orderBy: { roomNumber: "asc" },
  });

  const openRooms = rooms.filter((r) => r.status !== "Closed").length;
  const availableRooms = rooms.filter((r) => r.status === "Available").length;
  const totalWaiting = rooms.reduce(
    (sum, r) =>
      sum + r.queues.filter((q) => q.currentStation === "WaitDoctor").length,
    0
  );

  // Calculate average wait time (approximate from queue creation to now for waiting patients)
  const waitingQueues = rooms.flatMap((r) =>
    r.queues.filter((q) => q.currentStation === "WaitDoctor")
  );
  let avgWaitMinutes = 0;
  if (waitingQueues.length > 0) {
    const now = Date.now();
    const totalWaitMs = waitingQueues.reduce(
      (sum, q) => sum + (now - new Date(q.createdAt).getTime()),
      0
    );
    avgWaitMinutes = Math.round(totalWaitMs / waitingQueues.length / 60000);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ห้องตรวจ</h1>
        <p className="text-sm text-gray-500 mt-1">
          จัดการห้องตรวจและติดตามสถานะผู้ป่วย
        </p>
      </div>

      {/* Summary Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <DoorOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">จำนวนห้องเปิด</p>
              <p className="text-xl font-bold text-gray-900">{openRooms}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">ห้องว่าง</p>
              <p className="text-xl font-bold text-gray-900">
                {availableRooms}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">ผู้ป่วยรอ</p>
              <p className="text-xl font-bold text-gray-900">{totalWaiting}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">เวลารอเฉลี่ย</p>
              <p className="text-xl font-bold text-gray-900">
                {avgWaitMinutes} นาที
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Rooms Grid */}
      {rooms.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <DoorOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">ยังไม่มีข้อมูลห้องตรวจ</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {rooms.map((room) => {
            const currentPatient = room.queues.find(
              (q) => q.currentStation === "WithDoctor"
            );
            const waitingCount = room.queues.filter(
              (q) => q.currentStation === "WaitDoctor"
            ).length;

            return (
              <div
                key={room.id}
                className={`bg-white rounded-xl shadow-sm border border-gray-200 border-l-4 ${ROOM_BORDER_COLORS[room.status] || "border-l-gray-400"} overflow-hidden`}
              >
                {/* Room Header */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-lg font-bold text-gray-900">
                      ห้อง {room.roomNumber}
                    </h3>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border ${ROOM_STATUS_COLORS[room.status] || "bg-gray-100 text-gray-600"}`}
                    >
                      {ROOM_STATUS_LABELS[room.status] || room.status}
                    </span>
                  </div>
                  {room.roomName && (
                    <p className="text-sm text-gray-500">{room.roomName}</p>
                  )}
                  {room.roomType && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {room.roomType}
                    </p>
                  )}
                </div>

                {/* Room Content */}
                <div className="p-4 space-y-3">
                  {/* Assigned Doctor */}
                  <div>
                    <p className="text-xs text-gray-400 mb-1">แพทย์ประจำห้อง</p>
                    {room.assignedDoctor ? (
                      <p className="text-sm font-medium text-gray-800">
                        {room.assignedDoctor.firstName}{" "}
                        {room.assignedDoctor.lastName}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400">
                        ไม่มีแพทย์ประจำห้อง
                      </p>
                    )}
                  </div>

                  {/* Current Patient */}
                  <div>
                    <p className="text-xs text-gray-400 mb-1">
                      ผู้ป่วยกำลังตรวจ
                    </p>
                    {currentPatient ? (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
                        <p className="text-sm font-medium text-purple-800">
                          {currentPatient.patient.title}
                          {currentPatient.patient.firstNameTh}{" "}
                          {currentPatient.patient.lastNameTh}
                        </p>
                        <p className="text-xs text-purple-600 mt-0.5">
                          HN: {currentPatient.patient.hn} | คิว:{" "}
                          {currentPatient.queueNumber}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">-</p>
                    )}
                  </div>

                  {/* Waiting Count */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="text-xs text-gray-500">ผู้ป่วยรอตรวจ</span>
                    <span
                      className={`text-sm font-bold ${waitingCount > 0 ? "text-orange-600" : "text-gray-400"}`}
                    >
                      {waitingCount} คน
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
