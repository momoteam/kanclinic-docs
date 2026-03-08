"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface PatientData {
  id: string;
  queueNumber: string;
  patient: {
    id: string;
    hn: string;
    title: string;
    firstNameTh: string;
    lastNameTh: string;
    gender: string;
    bloodType: string;
    dateOfBirth: string | null;
    drugAllergies: { drugName: string; severity: string }[];
    underlyingDiseases: string;
  };
  visit: {
    id: string;
    screenings: {
      bloodPressureSys: number | null;
      bloodPressureDia: number | null;
      pulseRate: number | null;
      temperature: number | null;
      respiratoryRate: number | null;
      spo2: number | null;
      weight: number | null;
      height: number | null;
      bmi: number | null;
      chiefComplaint: string;
    }[];
  } | null;
}

interface DrugOption {
  id: string;
  genericName: string;
  tradeName: string;
  form: string;
  strength: string;
}

interface LabTestOption {
  id: string;
  code: string;
  nameTh: string;
  nameEn: string;
  category: string;
  normalRange: string;
  unit: string;
  price: number;
}

interface LabOrderItem {
  labTestId: string;
  priority: string;
  notes: string;
}

export default function DoctorWorkbenchPage({ params }: { params: Promise<{ queueId: string }> }) {
  const router = useRouter();
  const [data, setData] = useState<PatientData | null>(null);
  const [drugs, setDrugs] = useState<DrugOption[]>([]);
  const [labTests, setLabTests] = useState<LabTestOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [queueId, setQueueId] = useState("");

  const [soap, setSoap] = useState({ subjective: "", objective: "", assessment: "", plan: "" });
  const [diagnosis, setDiagnosis] = useState({ icd10Code: "", diagnosisNameTh: "", diagnosisNameEn: "", diagnosisType: "Primary" });
  const [prescriptionItems, setPrescriptionItems] = useState<{ drugId: string; dosage: string; frequency: string; durationDays: string; quantity: string; usage: string }[]>([]);
  const [labOrders, setLabOrders] = useState<LabOrderItem[]>([]);
  const [nextStation, setNextStation] = useState("WaitPharmacy");

  useEffect(() => { params.then(p => setQueueId(p.queueId)); }, [params]);

  useEffect(() => {
    if (!queueId) return;
    Promise.all([
      fetch(`/api/doctor?queueId=${queueId}`).then(r => r.json()),
      fetch(`/api/drugs`).then(r => r.json()),
      fetch(`/api/lab?action=tests`).then(r => r.json()).catch(() => []),
    ]).then(([queueData, drugData, labTestData]) => {
      setData(queueData);
      setDrugs(Array.isArray(drugData) ? drugData : []);
      setLabTests(Array.isArray(labTestData) ? labTestData : []);
      if (queueData?.visit?.screenings?.[0]?.chiefComplaint) {
        setSoap(prev => ({ ...prev, subjective: queueData.visit.screenings[0].chiefComplaint }));
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [queueId]);

  const addPrescription = () => {
    setPrescriptionItems([...prescriptionItems, { drugId: "", dosage: "", frequency: "วันละ 3 ครั้ง หลังอาหาร", durationDays: "3", quantity: "9", usage: "" }]);
  };

  const removePrescription = (idx: number) => {
    setPrescriptionItems(prescriptionItems.filter((_, i) => i !== idx));
  };

  const addLabOrder = () => {
    setLabOrders([...labOrders, { labTestId: "", priority: "Normal", notes: "" }]);
  };

  const removeLabOrder = (idx: number) => {
    setLabOrders(labOrders.filter((_, i) => i !== idx));
  };

  const updateLabOrder = (idx: number, field: keyof LabOrderItem, value: string) => {
    const updated = [...labOrders];
    updated[idx] = { ...updated[idx], [field]: value };
    setLabOrders(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    setSaving(true);
    try {
      const res = await fetch("/api/doctor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          queueId,
          visitId: data.visit?.id,
          patientId: data.patient.id,
          soap,
          diagnosis,
          prescriptionItems: prescriptionItems.filter(p => p.drugId),
          labOrders: labOrders.filter(l => l.labTestId),
          nextStation,
        }),
      });
      if (res.ok) {
        router.push("/doctor");
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">กำลังโหลดข้อมูลผู้ป่วย...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 text-lg">ไม่พบข้อมูลผู้ป่วย</p>
        <button onClick={() => router.back()} className="mt-4 px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
          กลับหน้าโต๊ะแพทย์
        </button>
      </div>
    );
  }

  const screening = data.visit?.screenings?.[0];
  let underlyingDiseases: string[] = [];
  try {
    if (data.patient.underlyingDiseases) {
      underlyingDiseases = JSON.parse(data.patient.underlyingDiseases);
    }
  } catch {
    // ignore
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">โต๊ะแพทย์ — บันทึกการตรวจ</h1>
          <p className="text-sm text-gray-500 mt-1">คิวหมายเลข {data.queueNumber}</p>
        </div>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          กลับ
        </button>
      </div>

      {/* Patient Header Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center text-lg font-bold text-purple-600 shrink-0">
            {data.queueNumber}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-semibold text-gray-900">
              {data.patient.title}{data.patient.firstNameTh} {data.patient.lastNameTh}
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 mt-1">
              <span>HN: {data.patient.hn}</span>
              <span>เพศ: {data.patient.gender === "Male" ? "ชาย" : "หญิง"}</span>
              {data.patient.bloodType && <span>กรุ๊ปเลือด: {data.patient.bloodType}</span>}
            </div>
          </div>

          {/* Vital Signs Summary */}
          {screening && (
            <div className="hidden lg:flex flex-wrap gap-3 text-sm shrink-0">
              {screening.bloodPressureSys && (
                <div className="px-3 py-1.5 bg-blue-50 rounded-lg text-blue-700">
                  BP {screening.bloodPressureSys}/{screening.bloodPressureDia}
                </div>
              )}
              {screening.pulseRate && (
                <div className="px-3 py-1.5 bg-blue-50 rounded-lg text-blue-700">
                  PR {screening.pulseRate}
                </div>
              )}
              {screening.temperature && (
                <div className="px-3 py-1.5 bg-blue-50 rounded-lg text-blue-700">
                  T {screening.temperature}°C
                </div>
              )}
              {screening.spo2 && (
                <div className="px-3 py-1.5 bg-blue-50 rounded-lg text-blue-700">
                  SpO2 {screening.spo2}%
                </div>
              )}
              {screening.weight && (
                <div className="px-3 py-1.5 bg-blue-50 rounded-lg text-blue-700">
                  W {screening.weight}kg
                </div>
              )}
              {screening.bmi && (
                <div className="px-3 py-1.5 bg-blue-50 rounded-lg text-blue-700">
                  BMI {screening.bmi.toFixed(1)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Alerts Row */}
        <div className="mt-3 space-y-2">
          {data.patient.drugAllergies.length > 0 && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <span className="font-semibold">แพ้ยา:</span>{" "}
              {data.patient.drugAllergies.map(a => `${a.drugName} (${a.severity})`).join(", ")}
            </div>
          )}
          {underlyingDiseases.length > 0 && (
            <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
              <span className="font-semibold">โรคประจำตัว:</span> {underlyingDiseases.join(", ")}
            </div>
          )}
        </div>

        {/* Mobile Vital Signs */}
        {screening && (
          <div className="mt-3 lg:hidden p-3 bg-blue-50 rounded-lg">
            <p className="text-xs font-semibold text-blue-700 mb-1">ผลคัดกรอง</p>
            <div className="flex flex-wrap gap-3 text-sm text-blue-800">
              {screening.bloodPressureSys && <span>BP: {screening.bloodPressureSys}/{screening.bloodPressureDia}</span>}
              {screening.pulseRate && <span>PR: {screening.pulseRate}</span>}
              {screening.temperature && <span>T: {screening.temperature}°C</span>}
              {screening.spo2 && <span>SpO2: {screening.spo2}%</span>}
              {screening.weight && <span>W: {screening.weight} kg</span>}
              {screening.bmi && <span>BMI: {screening.bmi.toFixed(1)}</span>}
            </div>
            {screening.chiefComplaint && (
              <p className="text-sm text-blue-800 mt-1">CC: {screening.chiefComplaint}</p>
            )}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SOAP Notes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">SOAP Notes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subjective (อาการที่ผู้ป่วยบอก)
              </label>
              <textarea
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                value={soap.subjective}
                onChange={e => setSoap({ ...soap, subjective: e.target.value })}
                placeholder="อาการสำคัญ, ระยะเวลา, ปัจจัยที่เกี่ยวข้อง..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Objective (ผลตรวจร่างกาย)
              </label>
              <textarea
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                value={soap.objective}
                onChange={e => setSoap({ ...soap, objective: e.target.value })}
                placeholder="ผลตรวจร่างกาย, สัญญาณชีพ..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assessment (การวินิจฉัย)
              </label>
              <textarea
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                value={soap.assessment}
                onChange={e => setSoap({ ...soap, assessment: e.target.value })}
                placeholder="การวินิจฉัยเบื้องต้น, Differential diagnosis..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plan (แผนการรักษา)
              </label>
              <textarea
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                value={soap.plan}
                onChange={e => setSoap({ ...soap, plan: e.target.value })}
                placeholder="แผนการรักษา, นัดติดตาม..."
              />
            </div>
          </div>
        </div>

        {/* Diagnosis */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">การวินิจฉัย (Diagnosis)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ICD-10 Code</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="เช่น J06.9"
                value={diagnosis.icd10Code}
                onChange={e => setDiagnosis({ ...diagnosis, icd10Code: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อวินิจฉัย (ไทย)</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                value={diagnosis.diagnosisNameTh}
                onChange={e => setDiagnosis({ ...diagnosis, diagnosisNameTh: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis (EN)</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                value={diagnosis.diagnosisNameEn}
                onChange={e => setDiagnosis({ ...diagnosis, diagnosisNameEn: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ประเภท</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                value={diagnosis.diagnosisType}
                onChange={e => setDiagnosis({ ...diagnosis, diagnosisType: e.target.value })}
              >
                <option value="Primary">Primary</option>
                <option value="Secondary">Secondary</option>
              </select>
            </div>
          </div>
        </div>

        {/* Prescriptions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">สั่งยา (Prescription)</h2>
            <button
              type="button"
              onClick={addPrescription}
              className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
            >
              + เพิ่มรายการยา
            </button>
          </div>
          {prescriptionItems.length === 0 ? (
            <p className="text-gray-400 text-center py-6">ยังไม่มีรายการสั่งยา กดปุ่ม &quot;เพิ่มรายการยา&quot; เพื่อเริ่มสั่งยา</p>
          ) : (
            <div className="space-y-4">
              {prescriptionItems.map((item, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-500">รายการที่ {idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => removePrescription(idx)}
                      className="text-red-500 text-sm hover:text-red-700"
                    >
                      ลบ
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-xs text-gray-500 mb-1">ยา</label>
                      <select
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        value={item.drugId}
                        onChange={e => {
                          const updated = [...prescriptionItems];
                          updated[idx].drugId = e.target.value;
                          setPrescriptionItems(updated);
                        }}
                      >
                        <option value="">เลือกยา</option>
                        {drugs.map(d => (
                          <option key={d.id} value={d.id}>
                            {d.genericName} {d.strength} ({d.form})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Dosage</label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="เช่น 1 เม็ด"
                        value={item.dosage}
                        onChange={e => {
                          const updated = [...prescriptionItems];
                          updated[idx].dosage = e.target.value;
                          setPrescriptionItems(updated);
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">วิธีใช้</label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        value={item.frequency}
                        onChange={e => {
                          const updated = [...prescriptionItems];
                          updated[idx].frequency = e.target.value;
                          setPrescriptionItems(updated);
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">จำนวนวัน</label>
                      <input
                        type="number"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        value={item.durationDays}
                        onChange={e => {
                          const updated = [...prescriptionItems];
                          updated[idx].durationDays = e.target.value;
                          setPrescriptionItems(updated);
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">จำนวนรวม</label>
                      <input
                        type="number"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        value={item.quantity}
                        onChange={e => {
                          const updated = [...prescriptionItems];
                          updated[idx].quantity = e.target.value;
                          setPrescriptionItems(updated);
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lab Orders */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">สั่งตรวจ Lab</h2>
            <button
              type="button"
              onClick={addLabOrder}
              className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors"
            >
              + เพิ่มรายการ Lab
            </button>
          </div>
          {labOrders.length === 0 ? (
            <p className="text-gray-400 text-center py-6">ยังไม่มีรายการสั่งตรวจ Lab กดปุ่ม &quot;เพิ่มรายการ Lab&quot; เพื่อสั่งตรวจ</p>
          ) : (
            <div className="space-y-4">
              {labOrders.map((item, idx) => (
                <div key={idx} className="border border-indigo-100 rounded-lg p-4 bg-indigo-50/30">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-indigo-600">Lab #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeLabOrder(idx)}
                      className="text-red-500 text-sm hover:text-red-700"
                    >
                      ลบ
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">รายการตรวจ</label>
                      <select
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        value={item.labTestId}
                        onChange={e => updateLabOrder(idx, "labTestId", e.target.value)}
                      >
                        <option value="">เลือกรายการตรวจ</option>
                        {labTests.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.code ? `[${t.code}] ` : ""}{t.nameTh}
                            {t.nameEn ? ` (${t.nameEn})` : ""}
                            {t.price > 0 ? ` - ${t.price.toLocaleString()}฿` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">ความเร่งด่วน</label>
                      <select
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        value={item.priority}
                        onChange={e => updateLabOrder(idx, "priority", e.target.value)}
                      >
                        <option value="Normal">Normal (ปกติ)</option>
                        <option value="Urgent">Urgent (เร่งด่วน)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">หมายเหตุ</label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="เช่น fasting 12 hrs"
                        value={item.notes}
                        onChange={e => updateLabOrder(idx, "notes", e.target.value)}
                      />
                    </div>
                  </div>
                  {/* Show selected lab test info */}
                  {item.labTestId && (() => {
                    const selectedTest = labTests.find(t => t.id === item.labTestId);
                    if (!selectedTest) return null;
                    return (
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                        {selectedTest.normalRange && (
                          <span>ค่าปกติ: {selectedTest.normalRange} {selectedTest.unit}</span>
                        )}
                        {selectedTest.category && (
                          <span>หมวด: {selectedTest.category}</span>
                        )}
                      </div>
                    );
                  })()}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Next Station */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">ส่งต่อ</h2>
          <div className="flex flex-wrap gap-3">
            {[
              { value: "WaitPharmacy", label: "ห้องยา", color: "bg-cyan-100 text-cyan-700 border-cyan-300", activeColor: "bg-cyan-200 border-cyan-400" },
              { value: "WaitPayment", label: "การเงิน", color: "bg-pink-100 text-pink-700 border-pink-300", activeColor: "bg-pink-200 border-pink-400" },
              { value: "Completed", label: "เสร็จสิ้น", color: "bg-green-100 text-green-700 border-green-300", activeColor: "bg-green-200 border-green-400" },
            ].map(opt => (
              <label
                key={opt.value}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 cursor-pointer transition-all ${
                  nextStation === opt.value
                    ? `${opt.color} ${opt.activeColor} font-semibold shadow-sm`
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="nextStation"
                  value={opt.value}
                  checked={nextStation === opt.value}
                  onChange={e => setNextStation(e.target.value)}
                  className="sr-only"
                />
                {opt.label}
              </label>
            ))}
          </div>
          {labOrders.filter(l => l.labTestId).length > 0 && nextStation !== "WaitPharmacy" && (
            <p className="mt-3 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
              มีรายการสั่งตรวจ Lab จะถูกส่งไปยังห้องปฏิบัติการอัตโนมัติ
            </p>
          )}
        </div>

        {/* Submit */}
        <div className="flex gap-3 justify-end pb-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors font-medium"
          >
            {saving ? "กำลังบันทึก..." : "บันทึก & ส่งต่อ"}
          </button>
        </div>
      </form>
    </div>
  );
}
