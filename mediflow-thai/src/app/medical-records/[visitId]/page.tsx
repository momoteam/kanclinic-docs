"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Save,
  FileSignature,
  Lock,
  Plus,
  Trash2,
  ArrowLeft,
  AlertTriangle,
  Loader2,
  Stethoscope,
} from "lucide-react";

interface DrugAllergy {
  id: string;
  drugName: string;
  reaction: string;
  severity: string;
}

interface Patient {
  id: string;
  hn: string;
  title: string;
  firstNameTh: string;
  lastNameTh: string;
  dateOfBirth: string | null;
  gender: string;
  bloodType: string;
  underlyingDiseases: string;
  drugAllergies: DrugAllergy[];
}

interface Screening {
  id: string;
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
}

interface DiagnosisForm {
  icd10Code: string;
  diagnosisNameTh: string;
  diagnosisNameEn: string;
  diagnosisType: string;
}

interface ExistingDiagnosis extends DiagnosisForm {
  id: string;
}

interface MedicalRecord {
  id: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  clinicalNotes: string;
  templateType: string;
  signedById: string | null;
  signedAt: string | null;
  isLocked: boolean;
  diagnoses: ExistingDiagnosis[];
  signedBy: { firstName: string; lastName: string } | null;
}

interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
}

interface VisitData {
  id: string;
  patient: Patient;
  doctor: Doctor;
  screenings: Screening[];
  medicalRecords: MedicalRecord[];
  visitDate: string;
  chiefComplaint: string;
}

const TEMPLATES = [
  { value: "SOAP", label: "SOAP Note" },
  { value: "ProgressNote", label: "Progress Note" },
  { value: "ProcedureNote", label: "Procedure Note" },
];

export default function MedicalRecordEditorPage() {
  const params = useParams();
  const router = useRouter();
  const visitId = params.visitId as string;

  const [visit, setVisit] = useState<VisitData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Form state
  const [templateType, setTemplateType] = useState("SOAP");
  const [subjective, setSubjective] = useState("");
  const [objective, setObjective] = useState("");
  const [assessment, setAssessment] = useState("");
  const [plan, setPlan] = useState("");
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [diagnoses, setDiagnoses] = useState<DiagnosisForm[]>([]);
  const [existingRecordId, setExistingRecordId] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  const fetchVisit = useCallback(async () => {
    try {
      const res = await fetch(`/api/medical-records?visitId=${visitId}`);
      if (!res.ok) throw new Error("ไม่พบข้อมูลการเข้าพบ");
      const data: VisitData = await res.json();
      setVisit(data);

      // Populate form from existing record
      if (data.medicalRecords && data.medicalRecords.length > 0) {
        const record = data.medicalRecords[0];
        setExistingRecordId(record.id);
        setTemplateType(record.templateType);
        setSubjective(record.subjective);
        setObjective(record.objective);
        setAssessment(record.assessment);
        setPlan(record.plan);
        setClinicalNotes(record.clinicalNotes);
        setIsLocked(record.isLocked);
        if (record.diagnoses && record.diagnoses.length > 0) {
          setDiagnoses(
            record.diagnoses.map((d) => ({
              icd10Code: d.icd10Code,
              diagnosisNameTh: d.diagnosisNameTh,
              diagnosisNameEn: d.diagnosisNameEn,
              diagnosisType: d.diagnosisType,
            }))
          );
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }, [visitId]);

  useEffect(() => {
    fetchVisit();
  }, [fetchVisit]);

  const addDiagnosis = () => {
    setDiagnoses((prev) => [
      ...prev,
      {
        icd10Code: "",
        diagnosisNameTh: "",
        diagnosisNameEn: "",
        diagnosisType: prev.length === 0 ? "Primary" : "Secondary",
      },
    ]);
  };

  const removeDiagnosis = (index: number) => {
    setDiagnoses((prev) => prev.filter((_, i) => i !== index));
  };

  const updateDiagnosis = (
    index: number,
    field: keyof DiagnosisForm,
    value: string
  ) => {
    setDiagnoses((prev) =>
      prev.map((d, i) => (i === index ? { ...d, [field]: value } : d))
    );
  };

  const handleSave = async () => {
    if (!visit) return;
    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const payload = {
        subjective,
        objective,
        assessment,
        plan,
        clinicalNotes,
        templateType,
        diagnoses,
      };

      let res: Response;
      if (existingRecordId) {
        res = await fetch("/api/medical-records", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: existingRecordId, ...payload }),
        });
      } else {
        res = await fetch("/api/medical-records", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            visitId,
            patientId: visit.patient.id,
            doctorId: visit.doctor.id,
            ...payload,
          }),
        });
      }

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "บันทึกไม่สำเร็จ");
      }

      const savedRecord: MedicalRecord = await res.json();
      setExistingRecordId(savedRecord.id);
      setSuccessMessage("บันทึกเวชระเบียนสำเร็จ");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  };

  const handleSign = async () => {
    if (!existingRecordId || !visit) return;
    if (
      !confirm(
        "ยืนยันการลงนามเวชระเบียน? หลังจากลงนามแล้วจะไม่สามารถแก้ไขได้"
      )
    )
      return;

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/medical-records", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: existingRecordId,
          sign: true,
          signedById: visit.doctor.id,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "ลงนามไม่สำเร็จ");
      }

      setIsLocked(true);
      setSuccessMessage("ลงนามเวชระเบียนสำเร็จ");
      // Refresh to update signed state
      await fetchVisit();
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <span className="ml-3 text-gray-500">กำลังโหลดข้อมูล...</span>
      </div>
    );
  }

  if (error && !visit) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-sm text-blue-600 hover:underline"
          >
            กลับ
          </button>
        </div>
      </div>
    );
  }

  if (!visit) return null;

  const screening = visit.screenings?.[0] || null;
  const existingRecord = visit.medicalRecords?.[0] || null;
  let underlyingDiseases: string[] = [];
  try {
    underlyingDiseases = JSON.parse(
      visit.patient.underlyingDiseases || "[]"
    );
  } catch {
    underlyingDiseases = [];
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/medical-records")}
            className="p-2 rounded-lg hover:bg-gray-100 transition"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              บันทึกเวชระเบียน
            </h1>
            <p className="text-sm text-gray-500">
              Visit ID: {visitId.slice(0, 8)}...
            </p>
          </div>
        </div>

        {isLocked && (
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
            <Lock className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">
              ลงนามแล้ว
              {existingRecord?.signedBy &&
                ` - ${existingRecord.signedBy.firstName} ${existingRecord.signedBy.lastName}`}
            </span>
          </div>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      {/* Patient Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Stethoscope className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-lg font-bold text-gray-900">
                {visit.patient.title}
                {visit.patient.firstNameTh} {visit.patient.lastNameTh}
              </h2>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                HN: {visit.patient.hn}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <span className="text-gray-400">เพศ:</span>{" "}
                <span className="text-gray-700">
                  {visit.patient.gender === "Male" ? "ชาย" : "หญิง"}
                </span>
              </div>
              <div>
                <span className="text-gray-400">กรุ๊ปเลือด:</span>{" "}
                <span className="text-gray-700">
                  {visit.patient.bloodType || "-"}
                </span>
              </div>
              <div>
                <span className="text-gray-400">แพทย์:</span>{" "}
                <span className="text-gray-700">
                  {visit.doctor.firstName} {visit.doctor.lastName}
                </span>
              </div>
              <div>
                <span className="text-gray-400">อาการสำคัญ:</span>{" "}
                <span className="text-gray-700">
                  {visit.chiefComplaint || screening?.chiefComplaint || "-"}
                </span>
              </div>
            </div>

            {/* Drug Allergies */}
            {visit.patient.drugAllergies.length > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-600 font-medium">
                  แพ้ยา:{" "}
                  {visit.patient.drugAllergies
                    .map((a) => `${a.drugName} (${a.reaction})`)
                    .join(", ")}
                </span>
              </div>
            )}

            {/* Underlying Diseases */}
            {underlyingDiseases.length > 0 && (
              <div className="mt-2">
                <span className="text-sm text-orange-600 font-medium">
                  โรคประจำตัว: {underlyingDiseases.join(", ")}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Screening Data */}
        {screening && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-2 font-medium">
              ข้อมูลคัดกรอง
            </p>
            <div className="grid grid-cols-3 md:grid-cols-7 gap-3 text-sm">
              <div className="bg-gray-50 rounded-lg px-3 py-2 text-center">
                <p className="text-[10px] text-gray-400">BP</p>
                <p className="font-medium text-gray-800">
                  {screening.bloodPressureSys && screening.bloodPressureDia
                    ? `${screening.bloodPressureSys}/${screening.bloodPressureDia}`
                    : "-"}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg px-3 py-2 text-center">
                <p className="text-[10px] text-gray-400">PR</p>
                <p className="font-medium text-gray-800">
                  {screening.pulseRate || "-"}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg px-3 py-2 text-center">
                <p className="text-[10px] text-gray-400">Temp</p>
                <p className="font-medium text-gray-800">
                  {screening.temperature
                    ? `${screening.temperature}C`
                    : "-"}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg px-3 py-2 text-center">
                <p className="text-[10px] text-gray-400">RR</p>
                <p className="font-medium text-gray-800">
                  {screening.respiratoryRate || "-"}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg px-3 py-2 text-center">
                <p className="text-[10px] text-gray-400">SpO2</p>
                <p className="font-medium text-gray-800">
                  {screening.spo2 ? `${screening.spo2}%` : "-"}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg px-3 py-2 text-center">
                <p className="text-[10px] text-gray-400">W/H</p>
                <p className="font-medium text-gray-800">
                  {screening.weight || "-"}/{screening.height || "-"}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg px-3 py-2 text-center">
                <p className="text-[10px] text-gray-400">BMI</p>
                <p className="font-medium text-gray-800">
                  {screening.bmi ? screening.bmi.toFixed(1) : "-"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Template Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          ประเภทบันทึก
        </h3>
        <div className="flex gap-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.value}
              onClick={() => !isLocked && setTemplateType(t.value)}
              disabled={isLocked}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                templateType === t.value
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              } ${isLocked ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* SOAP Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          {templateType === "SOAP"
            ? "SOAP Note"
            : templateType === "ProgressNote"
              ? "Progress Note"
              : "Procedure Note"}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subjective (S) - อาการที่ผู้ป่วยบอก
            </label>
            <textarea
              value={subjective}
              onChange={(e) => setSubjective(e.target.value)}
              disabled={isLocked}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
              placeholder="ผู้ป่วยมีอาการ..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Objective (O) - สิ่งที่ตรวจพบ
            </label>
            <textarea
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              disabled={isLocked}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
              placeholder="PE: GA fair, VS stable..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assessment (A) - การประเมิน/วินิจฉัย
            </label>
            <textarea
              value={assessment}
              onChange={(e) => setAssessment(e.target.value)}
              disabled={isLocked}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
              placeholder="การวินิจฉัยเบื้องต้น..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Plan (P) - แผนการรักษา
            </label>
            <textarea
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              disabled={isLocked}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
              placeholder="1. สั่งยา... 2. ส่งตรวจ Lab..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Clinical Notes - บันทึกเพิ่มเติม
            </label>
            <textarea
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              disabled={isLocked}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
              placeholder="หมายเหตุเพิ่มเติม..."
            />
          </div>
        </div>
      </div>

      {/* Diagnosis Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700">
            การวินิจฉัย (Diagnosis)
          </h3>
          {!isLocked && (
            <button
              onClick={addDiagnosis}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              <Plus className="w-4 h-4" /> เพิ่มการวินิจฉัย
            </button>
          )}
        </div>

        {diagnoses.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">
            ยังไม่มีการวินิจฉัย กดปุ่มด้านบนเพื่อเพิ่ม
          </p>
        ) : (
          <div className="space-y-3">
            {diagnoses.map((d, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 bg-gray-50"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-gray-500">
                    รายการที่ {index + 1}
                  </span>
                  {!isLocked && (
                    <button
                      onClick={() => removeDiagnosis(index)}
                      className="p-1 text-red-400 hover:text-red-600 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      รหัส ICD-10
                    </label>
                    <input
                      type="text"
                      value={d.icd10Code}
                      onChange={(e) =>
                        updateDiagnosis(index, "icd10Code", e.target.value)
                      }
                      disabled={isLocked}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      placeholder="เช่น J06.9"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      ชื่อโรค (ไทย)
                    </label>
                    <input
                      type="text"
                      value={d.diagnosisNameTh}
                      onChange={(e) =>
                        updateDiagnosis(
                          index,
                          "diagnosisNameTh",
                          e.target.value
                        )
                      }
                      disabled={isLocked}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      placeholder="เช่น ไข้หวัดเฉียบพลัน"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      ชื่อโรค (EN)
                    </label>
                    <input
                      type="text"
                      value={d.diagnosisNameEn}
                      onChange={(e) =>
                        updateDiagnosis(
                          index,
                          "diagnosisNameEn",
                          e.target.value
                        )
                      }
                      disabled={isLocked}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      placeholder="e.g. Acute URI"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      ประเภท
                    </label>
                    <select
                      value={d.diagnosisType}
                      onChange={(e) =>
                        updateDiagnosis(
                          index,
                          "diagnosisType",
                          e.target.value
                        )
                      }
                      disabled={isLocked}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                      <option value="Primary">Primary</option>
                      <option value="Secondary">Secondary</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {existingRecordId ? (
              <span>
                แก้ไขเวชระเบียน{" "}
                <span className="font-mono text-gray-400">
                  #{existingRecordId.slice(0, 8)}
                </span>
              </span>
            ) : (
              <span>สร้างเวชระเบียนใหม่</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {!isLocked && (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 bg-blue-600 text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  บันทึก
                </button>

                {existingRecordId && (
                  <button
                    onClick={handleSign}
                    disabled={saving}
                    className="flex items-center gap-2 bg-green-600 text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-green-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <FileSignature className="w-4 h-4" />
                    ลงนาม
                  </button>
                )}
              </>
            )}

            {isLocked && (
              <div className="flex items-center gap-2 text-sm text-green-700">
                <Lock className="w-4 h-4" />
                เวชระเบียนถูกล็อค - ไม่สามารถแก้ไขได้
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
