import { prisma } from "@/lib/prisma";
import { STATION_LABELS, STATION_COLORS } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function QueueDisplayPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const queues = await prisma.queue.findMany({
    where: {
      queueDate: { gte: today },
      currentStation: { not: "Completed" },
    },
    include: {
      room: true,
    },
    orderBy: [
      { priority: "desc" },
      { createdAt: "asc" },
    ],
  });

  const stations = [
    "WaitScreening",
    "Screening",
    "WaitDoctor",
    "WithDoctor",
    "WaitPharmacy",
    "WaitPayment",
  ];

  // Count completed today
  const completedCount = await prisma.queue.count({
    where: {
      queueDate: { gte: today },
      currentStation: "Completed",
    },
  });

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-white">คิวผู้ป่วย — กานต์คลินิก</h1>
        <p className="text-gray-400 text-lg mt-1">
          รอดำเนินการ: {queues.length} | เสร็จสิ้น: {completedCount}
        </p>
      </div>

      {/* Station Columns */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stations.map((station) => {
          const stationQueues = queues.filter(q => q.currentStation === station);
          return (
            <div key={station} className="bg-gray-800 rounded-xl p-4">
              <div className="text-center mb-3">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${STATION_COLORS[station]}`}>
                  {STATION_LABELS[station]}
                </span>
                <p className="text-gray-500 text-sm mt-1">{stationQueues.length} คิว</p>
              </div>

              <div className="space-y-2">
                {stationQueues.length === 0 ? (
                  <p className="text-gray-600 text-center text-sm py-4">ว่าง</p>
                ) : (
                  stationQueues.map((queue) => (
                    <div
                      key={queue.id}
                      className={`rounded-lg p-3 text-center ${
                        queue.priority === "Emergency"
                          ? "bg-red-900 border-2 border-red-500"
                          : queue.priority === "Urgent"
                          ? "bg-yellow-900 border border-yellow-600"
                          : "bg-gray-700"
                      }`}
                    >
                      <p className={`text-2xl font-bold ${
                        queue.priority === "Emergency" ? "text-red-300" :
                        queue.priority === "Urgent" ? "text-yellow-300" :
                        "text-white"
                      }`}>
                        {queue.queueNumber}
                      </p>
                      {queue.room && (
                        <p className="text-xs text-gray-400 mt-1">ห้อง {queue.room.roomNumber}</p>
                      )}
                      {queue.priority !== "Normal" && (
                        <span className={`text-xs ${queue.priority === "Emergency" ? "text-red-400" : "text-yellow-400"}`}>
                          {queue.priority === "Emergency" ? "ฉุกเฉิน" : "เร่งด่วน"}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Auto-refresh hint */}
      <p className="text-center text-gray-600 text-sm mt-6">
        หน้าจอนี้จะรีเฟรชอัตโนมัติ — กรุณาเปิดค้างไว้
      </p>
    </div>
  );
}
