"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface QueueData {
  id: string;
  queueNumber: string;
  patient: {
    id: string;
    hn: string;
    title: string;
    firstNameTh: string;
    lastNameTh: string;
    dateOfBirth: string | null;
    gender: string;
    bloodType: string;
    drugAllergies: { drugName: string; severity: string }[];
    underlyingDiseases: string;
  };
}

export default function ScreeningFormPage({ params }: { params: Promise<{ queueId: string }> }) {
  const router = useRouter();
  const [queue, setQueue] = useState<QueueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [queueId, setQueueId] = useState<string>("");

  const [form, setForm] = useState({
    bloodPressureSys: "",
    bloodPressureDia: "",
    pulseRate: "",
    temperature: "",
    respiratoryRate: "",
    spo2: "",
    weight: "",
    height: "",
    chiefComplaint: "",
    painScale: "",
    triageLevel: "5_NonUrgent",
    notes: "",
  });

  useEffect(() => {
    params.then((p) => setQueueId(p.queueId));
  }, [params]);

  useEffect(() => {
    if (!queueId) return;
    fetch(`/api/screening?queueId=${queueId}`)
      .then((r) => r.json())
      .then((data) => {
        setQueue(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [queueId]);

  const bmi = form.weight && form.height
    ? (parseFloat(form.weight) / ((parseFloat(form.height) / 100) ** 2)).toFixed(1)
    : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queue) return;
    setSaving(true);
    try {
      const res = await fetch("/api/screening", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          queueId: queue.id,
          patientId: queue.patient.id,
          ...form,
          bmi: bmi ? parseFloat(bmi) : null,
        }),
      });
      if (res.ok) {
        router.push("/screening");
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-400">กำลังโหลด...</div>;
  if (!queue) return <div className="text-center py-12 text-red-500">ไม่พบข้อมูลคิว</div>;

  const diseases = (() => {
    try { return JSON.parse(queue.patient.underlyingDiseases || "[]"); } catch { return []; }
  })();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">คัดกรองผู้ป่วย</h1>

      {/* Patient Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-xl font-bold text-blue-600">
            {queue.queueNumber}
          </div>
          <div>
            <p className="text-lg font-semibold">{queue.patient.title}{queue.patient.firstNameTh} {queue.patient.lastNameTh}</p>
            <p className="text-sm text-gray-500">HN: {queue.patient.hn} | เพศ: {queue.patient.gender === "Male" ? "ชาย" : "หญิง"} | กรุ๊ปเลือด: {queue.patient.bloodType || "-"}</p>
          </div>
        </div>
        {queue.patient.drugAllergies.length > 0 && (
          <div className="mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            แพ้ยา: {queue.patient.drugAllergies.map(a => `${a.drugName} (${a.severity})`).join(", ")}
          </div>
        )}
        {diseases.length > 0 && (
          <div className="mt-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
            โรคประจำตัว: {diseases.join(", ")}
          </div>
        )}
      </div>

      {/* Screening Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Vital Signs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">สัญญาณชีพ (Vital Signs)</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ความดันโลหิต (mmHg)</label>
              <div className="flex items-center gap-1">
                <input type="number" placeholder="Sys" className="w-full border border-gray-300 rounded-lg px-3 py-2" value={form.bloodPressureSys} onChange={e => setForm({...form, bloodPressureSys: e.target.value})} />
                <span>/</span>
                <input type="number" placeholder="Dia" className="w-full border border-gray-300 rounded-lg px-3 py-2" value={form.bloodPressureDia} onChange={e => setForm({...form, bloodPressureDia: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ชีพจร (bpm)</label>
              <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2" value={form.pulseRate} onChange={e => setForm({...form, pulseRate: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">อุณหภูมิ (°C)</label>
              <input type="number" step="0.1" className="w-full border border-gray-300 rounded-lg px-3 py-2" value={form.temperature} onChange={e => setForm({...form, temperature: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">อัตราหายใจ (ครั้ง/นาที)</label>
              <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2" value={form.respiratoryRate} onChange={e => setForm({...form, respiratoryRate: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SpO2 (%)</label>
              <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2" value={form.spo2} onChange={e => setForm({...form, spo2: e.target.value})} />
            </div>
          </div>
        </div>

        {/* Body Measurements */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">ข้อมูลร่างกาย</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">น้ำหนัก (kg)</label>
              <input type="number" step="0.1" className="w-full border border-gray-300 rounded-lg px-3 py-2" value={form.weight} onChange={e => setForm({...form, weight: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ส่วนสูง (cm)</label>
              <input type="number" step="0.1" className="w-full border border-gray-300 rounded-lg px-3 py-2" value={form.height} onChange={e => setForm({...form, height: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">BMI</label>
              <input type="text" readOnly className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2" value={bmi || "-"} />
            </div>
          </div>
        </div>

        {/* Chief Complaint & Triage */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">อาการเบื้องต้น</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">อาการสำคัญ (Chief Complaint)</label>
              <textarea rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2" value={form.chiefComplaint} onChange={e => setForm({...form, chiefComplaint: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pain Scale (0-10)</label>
                <input type="number" min="0" max="10" className="w-full border border-gray-300 rounded-lg px-3 py-2" value={form.painScale} onChange={e => setForm({...form, painScale: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ระดับความเร่งด่วน (Triage)</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2" value={form.triageLevel} onChange={e => setForm({...form, triageLevel: e.target.value})}>
                  <option value="1_Resuscitation">1 - Resuscitation (กู้ชีพ)</option>
                  <option value="2_Emergency">2 - Emergency (ฉุกเฉิน)</option>
                  <option value="3_Urgent">3 - Urgent (เร่งด่วน)</option>
                  <option value="4_SemiUrgent">4 - Semi-Urgent (กึ่งเร่งด่วน)</option>
                  <option value="5_NonUrgent">5 - Non-Urgent (ไม่เร่งด่วน)</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
              <textarea rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button type="button" onClick={() => router.back()} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
            ยกเลิก
          </button>
          <button type="submit" disabled={saving} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {saving ? "กำลังบันทึก..." : "บันทึกผลคัดกรอง & ส่งพบแพทย์"}
          </button>
        </div>
      </form>
    </div>
  );
}
