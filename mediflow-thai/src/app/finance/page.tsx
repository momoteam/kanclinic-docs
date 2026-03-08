import { prisma } from "@/lib/prisma";
import { formatDate, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  Pending: "รอชำระ",
  Paid: "ชำระแล้ว",
  PartialPaid: "ชำระบางส่วน",
  Cancelled: "ยกเลิก",
  Refunded: "คืนเงิน",
};

const STATUS_COLORS: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-700",
  Paid: "bg-green-100 text-green-700",
  PartialPaid: "bg-orange-100 text-orange-700",
  Cancelled: "bg-gray-100 text-gray-500",
  Refunded: "bg-red-100 text-red-700",
};

const PAYMENT_LABELS: Record<string, string> = {
  Cash: "เงินสด",
  Transfer: "โอนเงิน",
  CreditCard: "บัตรเครดิต",
  DebitCard: "บัตรเดบิต",
  QRPromptPay: "QR/PromptPay",
};

export default async function FinancePage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const invoices = await prisma.invoice.findMany({
    include: {
      patient: { include: { insurancePlan: true } },
      items: true,
      payments: true,
      createdBy: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Daily summary
  const todayInvoices = invoices.filter(inv => new Date(inv.createdAt) >= today);
  const todayRevenue = todayInvoices
    .filter(inv => inv.status === "Paid")
    .reduce((sum, inv) => sum + inv.totalAmount, 0);
  const todayPending = todayInvoices
    .filter(inv => inv.status === "Pending")
    .reduce((sum, inv) => sum + inv.totalAmount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">การเงิน</h1>
        <p className="text-sm text-gray-500">{formatDate(new Date())}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">รายรับวันนี้</p>
          <p className="text-2xl font-bold text-green-600">฿{todayRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">รอชำระ</p>
          <p className="text-2xl font-bold text-yellow-600">฿{todayPending.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">ใบเสร็จวันนี้</p>
          <p className="text-2xl font-bold text-blue-600">{todayInvoices.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">ใบเสร็จทั้งหมด</p>
          <p className="text-2xl font-bold text-gray-700">{invoices.length}</p>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">รายการใบเสร็จ</h2>
        {invoices.length === 0 ? (
          <p className="text-gray-400 text-center py-8">ยังไม่มีใบเสร็จ</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="pb-3 font-medium">เลขใบเสร็จ</th>
                <th className="pb-3 font-medium">วันที่</th>
                <th className="pb-3 font-medium">ผู้ป่วย</th>
                <th className="pb-3 font-medium">สิทธิ</th>
                <th className="pb-3 font-medium text-right">ยอดรวม</th>
                <th className="pb-3 font-medium text-right">ส่วนลด</th>
                <th className="pb-3 font-medium text-right">สิทธิครอบคลุม</th>
                <th className="pb-3 font-medium text-right">ผู้ป่วยจ่าย</th>
                <th className="pb-3 font-medium">สถานะ</th>
                <th className="pb-3 font-medium">ช่องทาง</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 font-medium text-blue-600">{inv.invoiceNumber || "-"}</td>
                  <td className="py-3">{formatDateTime(inv.createdAt)}</td>
                  <td className="py-3">{inv.patient.firstNameTh} {inv.patient.lastNameTh}</td>
                  <td className="py-3 text-gray-500">{inv.patient.insurancePlan?.name || "จ่ายเอง"}</td>
                  <td className="py-3 text-right">฿{inv.totalAmount.toLocaleString()}</td>
                  <td className="py-3 text-right text-red-500">{inv.discountAmount > 0 ? `-฿${inv.discountAmount.toLocaleString()}` : "-"}</td>
                  <td className="py-3 text-right text-blue-500">{inv.insuranceCoverage > 0 ? `฿${inv.insuranceCoverage.toLocaleString()}` : "-"}</td>
                  <td className="py-3 text-right font-semibold">฿{inv.patientPay.toLocaleString()}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[inv.status]}`}>
                      {STATUS_LABELS[inv.status] || inv.status}
                    </span>
                  </td>
                  <td className="py-3 text-gray-500">
                    {inv.payments.length > 0
                      ? inv.payments.map(p => PAYMENT_LABELS[p.paymentMethod] || p.paymentMethod).join(", ")
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
