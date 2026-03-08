# MediFlow Thai - Data Relations

> ระบบ Entity-Relationship สำหรับ MediFlow Thai (kanclinic.base44.app)
> Multi-tenant Clinic Management System for Thai Healthcare

---

## สรุปภาพรวม Entities

| # | Entity | คำอธิบาย | ประเภท |
|---|--------|----------|--------|
| 1 | Clinic | ข้อมูลคลินิก | Master |
| 2 | User | ผู้ใช้ระบบ (แพทย์, พยาบาล, เภสัชกร, แคชเชียร์, ต้อนรับ) | Master |
| 3 | Patient | ผู้ป่วย | Master |
| 4 | Service | บริการ | Master |
| 5 | Drug | ยา/เวชภัณฑ์ | Master |
| 6 | LabTest | รายการตรวจ Lab | Master |
| 7 | ExaminationRoom | ห้องตรวจ | Master |
| 8 | Appointment | นัดหมาย | Transaction |
| 9 | Queue | คิว | Transaction |
| 10 | Visit | การเข้ารับบริการ | Transaction |
| 11 | Screening | การคัดกรอง | Transaction |
| 12 | MedicalRecord | เวชระเบียน | Transaction |
| 13 | Diagnosis | การวินิจฉัย | Transaction |
| 14 | Prescription | ใบสั่งยา | Transaction |
| 15 | PrescriptionItem | รายการยาในใบสั่งยา | Transaction |
| 16 | LabOrder | คำสั่งตรวจ Lab | Transaction |
| 17 | LabResult | ผลตรวจ Lab | Transaction |
| 18 | Procedure | หัตถการ | Transaction |
| 19 | Dispensing | การจ่ายยา | Transaction |
| 20 | Invoice | ใบแจ้งหนี้/ใบเสร็จ | Transaction |
| 21 | InvoiceItem | รายการในใบแจ้งหนี้ | Transaction |
| 22 | Payment | การชำระเงิน | Transaction |
| 23 | DrugStock | คลังยา | Inventory |
| 24 | DrugMovement | การเคลื่อนไหวยา | Inventory |
| 25 | Notification | การแจ้งเตือน | System |
| 26 | DocumentHeader | หัวกระดาษเอกสาร | Config |
| 27 | InsurancePlan | สิทธิการรักษา | Config |
| 28 | DrugAllergy | ประวัติแพ้ยา | Medical |

---

## Entity Details & Fields

### 1. Clinic (คลินิก)
```
Clinic {
  id                  : UUID (PK)
  name_th             : String          -- ชื่อคลินิก (ไทย)
  name_en             : String          -- ชื่อคลินิก (อังกฤษ)
  license_number      : String          -- เลขใบอนุญาต
  clinic_type         : Enum            -- ประเภทคลินิก
  address             : Text            -- ที่อยู่
  sub_district        : String          -- ตำบล
  district            : String          -- อำเภอ
  province            : String          -- จังหวัด
  postal_code         : String          -- รหัสไปรษณีย์
  phone               : String          -- โทรศัพท์
  fax                 : String          -- โทรสาร
  email               : String          -- อีเมล
  website             : String          -- เว็บไซต์
  line_oa             : String          -- Line Official
  logo_url            : String          -- URL โลโก้
  latitude            : Decimal         -- พิกัดละติจูด
  longitude           : Decimal         -- พิกัดลองจิจูด
  operating_hours     : JSON            -- เวลาทำการ
  settings            : JSON            -- ตั้งค่าทั่วไป
  created_at          : DateTime
  updated_at          : DateTime
}
```

### 2. User (ผู้ใช้ระบบ)
```
User {
  id                  : UUID (PK)
  clinic_id           : UUID (FK → Clinic)
  email               : String (Unique)
  password_hash       : String
  first_name          : String
  last_name           : String
  role                : Enum [Admin, Doctor, Nurse, Pharmacist, Cashier, Receptionist]
  license_number      : String          -- เลขใบประกอบวิชาชีพ (สำหรับแพทย์)
  specialization      : String          -- ความเชี่ยวชาญ
  phone               : String
  avatar_url          : String
  is_active           : Boolean
  last_login_at       : DateTime
  created_at          : DateTime
  updated_at          : DateTime
}
```

### 3. Patient (ผู้ป่วย)
```
Patient {
  id                  : UUID (PK)
  clinic_id           : UUID (FK → Clinic)
  hn                  : String (Unique)  -- Hospital Number: KAN-YYYYMMDD-XXXX
  id_card_number      : String           -- เลขบัตรประชาชน 13 หลัก
  title               : Enum             -- คำนำหน้า
  first_name_th       : String
  last_name_th        : String
  first_name_en       : String
  last_name_en        : String
  date_of_birth       : Date
  gender              : Enum [Male, Female, Other]
  blood_type          : Enum [A+, A-, B+, B-, AB+, AB-, O+, O-]
  nationality         : String
  religion            : String
  phone               : String
  line_id             : String
  email               : String
  address             : Text
  sub_district        : String
  district            : String
  province            : String
  postal_code         : String
  insurance_plan_id   : UUID (FK → InsurancePlan)
  emergency_contact_name     : String
  emergency_contact_relation : String
  emergency_contact_phone    : String
  underlying_diseases : JSON             -- โรคประจำตัว []
  photo_url           : String
  is_active           : Boolean
  created_at          : DateTime
  updated_at          : DateTime
}
```

### 4. DrugAllergy (ประวัติแพ้ยา)
```
DrugAllergy {
  id                  : UUID (PK)
  patient_id          : UUID (FK → Patient)
  drug_name           : String           -- ชื่อยาที่แพ้
  reaction            : String           -- อาการแพ้
  severity            : Enum [Mild, Moderate, Severe, Fatal]
  noted_date          : Date
  noted_by            : UUID (FK → User)
  created_at          : DateTime
}
```

### 5. Service (บริการ)
```
Service {
  id                  : UUID (PK)
  clinic_id           : UUID (FK → Clinic)
  code                : String           -- รหัสบริการ
  name_th             : String
  name_en             : String
  category            : Enum [General, Specialist, Procedure, Lab, Vaccine, Other]
  price               : Decimal
  duration_minutes    : Integer
  description         : Text
  is_active           : Boolean
  created_at          : DateTime
  updated_at          : DateTime
}
```

### 6. Drug (ยา)
```
Drug {
  id                  : UUID (PK)
  clinic_id           : UUID (FK → Clinic)
  code                : String           -- รหัสยา
  generic_name        : String           -- ชื่อสามัญ
  trade_name          : String           -- ชื่อการค้า
  form                : Enum [Tablet, Capsule, Liquid, Injection, Cream, Ointment, Drop, Inhaler, Other]
  strength            : String           -- ความแรง
  unit                : String           -- หน่วย
  category            : String           -- หมวดหมู่ยา
  min_stock           : Integer          -- จำนวนขั้นต่ำ
  price               : Decimal          -- ราคาขาย
  cost                : Decimal          -- ราคาทุน
  usage_instructions  : Text             -- วิธีใช้มาตรฐาน
  precautions         : Text             -- ข้อควรระวัง
  is_active           : Boolean
  created_at          : DateTime
  updated_at          : DateTime
}
```

### 7. LabTest (รายการตรวจ Lab)
```
LabTest {
  id                  : UUID (PK)
  clinic_id           : UUID (FK → Clinic)
  code                : String
  name_th             : String
  name_en             : String
  category            : String           -- หมวดหมู่ (CBC, Chemistry, Urine, etc.)
  normal_range        : String           -- ค่าปกติ
  unit                : String           -- หน่วย
  price               : Decimal
  is_active           : Boolean
  created_at          : DateTime
}
```

### 8. ExaminationRoom (ห้องตรวจ)
```
ExaminationRoom {
  id                  : UUID (PK)
  clinic_id           : UUID (FK → Clinic)
  room_number         : String
  room_name           : String
  room_type           : String           -- ประเภทห้อง
  assigned_doctor_id  : UUID (FK → User) -- แพทย์ประจำห้อง
  status              : Enum [Available, Occupied, Closed]
  created_at          : DateTime
  updated_at          : DateTime
}
```

### 9. InsurancePlan (สิทธิการรักษา)
```
InsurancePlan {
  id                  : UUID (PK)
  clinic_id           : UUID (FK → Clinic)
  name                : String           -- ชื่อสิทธิ
  type                : Enum [UC, SocialSecurity, Government, PrivateInsurance, SelfPay]
  discount_percent    : Decimal          -- ส่วนลด %
  coverage_limit      : Decimal          -- เพดานค่าใช้จ่าย
  description         : Text
  is_active           : Boolean
  created_at          : DateTime
}
```

### 10. Appointment (นัดหมาย)
```
Appointment {
  id                  : UUID (PK)
  clinic_id           : UUID (FK → Clinic)
  patient_id          : UUID (FK → Patient)
  doctor_id           : UUID (FK → User)
  service_id          : UUID (FK → Service)
  appointment_date    : Date
  appointment_time    : Time
  duration_minutes    : Integer
  status              : Enum [Scheduled, Confirmed, CheckedIn, Completed, Cancelled, NoShow]
  notes               : Text
  reminder_sent       : Boolean
  created_by          : UUID (FK → User)
  created_at          : DateTime
  updated_at          : DateTime
}
```

### 11. Queue (คิว)
```
Queue {
  id                  : UUID (PK)
  clinic_id           : UUID (FK → Clinic)
  patient_id          : UUID (FK → Patient)
  appointment_id      : UUID (FK → Appointment, nullable)
  visit_id            : UUID (FK → Visit, nullable)
  queue_number        : String           -- เลขคิว: A001, B001
  queue_type          : Enum [WalkIn, Appointment]
  priority            : Enum [Normal, Urgent, Emergency]
  current_station     : Enum [WaitScreening, Screening, WaitDoctor, WithDoctor, WaitPharmacy, WaitPayment, Completed]
  room_id             : UUID (FK → ExaminationRoom, nullable)
  called_at           : DateTime
  completed_at        : DateTime
  queue_date          : Date
  created_at          : DateTime
  updated_at          : DateTime
}
```

### 12. Visit (การเข้ารับบริการ)
```
Visit {
  id                  : UUID (PK)
  clinic_id           : UUID (FK → Clinic)
  patient_id          : UUID (FK → Patient)
  doctor_id           : UUID (FK → User)
  queue_id            : UUID (FK → Queue)
  appointment_id      : UUID (FK → Appointment, nullable)
  visit_date          : Date
  visit_time          : Time
  visit_type          : Enum [WalkIn, Appointment, FollowUp]
  status              : Enum [InProgress, Completed, Cancelled]
  chief_complaint     : Text             -- อาการสำคัญ
  notes               : Text
  created_at          : DateTime
  updated_at          : DateTime
}
```

### 13. Screening (การคัดกรอง)
```
Screening {
  id                  : UUID (PK)
  visit_id            : UUID (FK → Visit)
  patient_id          : UUID (FK → Patient)
  screened_by         : UUID (FK → User)  -- พยาบาลที่คัดกรอง
  blood_pressure_sys  : Integer           -- ความดัน systolic
  blood_pressure_dia  : Integer           -- ความดัน diastolic
  pulse_rate          : Integer           -- ชีพจร
  temperature         : Decimal           -- อุณหภูมิ °C
  respiratory_rate    : Integer           -- อัตราการหายใจ
  spo2                : Integer           -- Oxygen Saturation %
  weight              : Decimal           -- น้ำหนัก kg
  height              : Decimal           -- ส่วนสูง cm
  bmi                 : Decimal           -- BMI (คำนวณอัตโนมัติ)
  chief_complaint     : Text              -- อาการสำคัญ
  pain_scale          : Integer           -- ระดับความปวด 0-10
  triage_level        : Enum [1_Resuscitation, 2_Emergency, 3_Urgent, 4_SemiUrgent, 5_NonUrgent]
  notes               : Text
  screened_at         : DateTime
  created_at          : DateTime
}
```

### 14. MedicalRecord (เวชระเบียน)
```
MedicalRecord {
  id                  : UUID (PK)
  visit_id            : UUID (FK → Visit)
  patient_id          : UUID (FK → Patient)
  doctor_id           : UUID (FK → User)
  subjective          : Text              -- S: อาการที่ผู้ป่วยบอก
  objective           : Text              -- O: ผลตรวจร่างกาย
  assessment          : Text              -- A: การประเมิน
  plan                : Text              -- P: แผนการรักษา
  clinical_notes      : Text              -- บันทึกเพิ่มเติม
  template_type       : Enum [SOAP, ProgressNote, ProcedureNote]
  attachments         : JSON              -- ไฟล์แนบ [{url, name, type}]
  signed_by           : UUID (FK → User)
  signed_at           : DateTime
  is_locked           : Boolean           -- ล็อคหลังลงนาม
  created_at          : DateTime
  updated_at          : DateTime
}
```

### 15. Diagnosis (การวินิจฉัย)
```
Diagnosis {
  id                  : UUID (PK)
  visit_id            : UUID (FK → Visit)
  medical_record_id   : UUID (FK → MedicalRecord)
  patient_id          : UUID (FK → Patient)
  doctor_id           : UUID (FK → User)
  icd10_code          : String            -- รหัส ICD-10
  diagnosis_name_th   : String            -- ชื่อโรค (ไทย)
  diagnosis_name_en   : String            -- ชื่อโรค (อังกฤษ)
  diagnosis_type      : Enum [Primary, Secondary]
  notes               : Text
  created_at          : DateTime
}
```

### 16. Prescription (ใบสั่งยา)
```
Prescription {
  id                  : UUID (PK)
  visit_id            : UUID (FK → Visit)
  patient_id          : UUID (FK → Patient)
  doctor_id           : UUID (FK → User)
  status              : Enum [Pending, Dispensing, Dispensed, Cancelled]
  notes               : Text
  created_at          : DateTime
  updated_at          : DateTime
}
```

### 17. PrescriptionItem (รายการยาในใบสั่งยา)
```
PrescriptionItem {
  id                  : UUID (PK)
  prescription_id     : UUID (FK → Prescription)
  drug_id             : UUID (FK → Drug)
  dosage              : String            -- ขนาดยา
  frequency           : String            -- ความถี่ (วันละ 3 ครั้ง หลังอาหาร)
  duration_days       : Integer           -- จำนวนวัน
  quantity            : Integer           -- จำนวนจ่าย
  usage_instructions  : Text              -- วิธีใช้
  notes               : Text
  created_at          : DateTime
}
```

### 18. LabOrder (คำสั่งตรวจ Lab)
```
LabOrder {
  id                  : UUID (PK)
  visit_id            : UUID (FK → Visit)
  patient_id          : UUID (FK → Patient)
  doctor_id           : UUID (FK → User)   -- แพทย์ผู้สั่ง
  lab_test_id         : UUID (FK → LabTest)
  status              : Enum [Pending, Processing, Completed]
  priority            : Enum [Normal, Urgent]
  notes               : Text
  ordered_at          : DateTime
  created_at          : DateTime
  updated_at          : DateTime
}
```

### 19. LabResult (ผลตรวจ Lab)
```
LabResult {
  id                  : UUID (PK)
  lab_order_id        : UUID (FK → LabOrder)
  patient_id          : UUID (FK → Patient)
  result_value        : String            -- ค่าผล
  result_unit         : String            -- หน่วย
  normal_range        : String            -- ค่าปกติ
  is_abnormal         : Boolean           -- ผลผิดปกติ
  interpretation      : Text              -- การแปลผล
  attachment_url      : String            -- ไฟล์แนบ
  performed_by        : UUID (FK → User)  -- นักเทคนิค
  verified_by         : UUID (FK → User)  -- ผู้ตรวจสอบ
  result_at           : DateTime
  created_at          : DateTime
}
```

### 20. Procedure (หัตถการ)
```
Procedure {
  id                  : UUID (PK)
  visit_id            : UUID (FK → Visit)
  patient_id          : UUID (FK → Patient)
  doctor_id           : UUID (FK → User)
  service_id          : UUID (FK → Service)
  procedure_name      : String
  description         : Text
  findings            : Text              -- ผลหัตถการ
  complications       : Text              -- ภาวะแทรกซ้อน
  before_images       : JSON              -- รูปก่อน [{url}]
  after_images        : JSON              -- รูปหลัง [{url}]
  performed_at        : DateTime
  created_at          : DateTime
}
```

### 21. Dispensing (การจ่ายยา)
```
Dispensing {
  id                  : UUID (PK)
  prescription_id     : UUID (FK → Prescription)
  patient_id          : UUID (FK → Patient)
  dispensed_by        : UUID (FK → User)  -- เภสัชกร
  status              : Enum [Preparing, Ready, Dispensed]
  allergy_checked     : Boolean
  interaction_checked : Boolean
  counseling_notes    : Text              -- คำแนะนำ
  dispensed_at        : DateTime
  created_at          : DateTime
}
```

### 22. DrugStock (คลังยา)
```
DrugStock {
  id                  : UUID (PK)
  clinic_id           : UUID (FK → Clinic)
  drug_id             : UUID (FK → Drug)
  lot_number          : String
  expiry_date         : Date
  quantity            : Integer           -- จำนวนคงเหลือ
  unit_cost           : Decimal
  received_date       : Date
  created_at          : DateTime
  updated_at          : DateTime
}
```

### 23. DrugMovement (การเคลื่อนไหวยา)
```
DrugMovement {
  id                  : UUID (PK)
  drug_stock_id       : UUID (FK → DrugStock)
  drug_id             : UUID (FK → Drug)
  movement_type       : Enum [Receive, Dispense, Return, Adjust, Expired]
  quantity            : Integer           -- จำนวน (+ รับเข้า, - จ่ายออก)
  reference_id        : String            -- อ้างอิง (dispensing_id, etc.)
  notes               : Text
  performed_by        : UUID (FK → User)
  created_at          : DateTime
}
```

### 24. Invoice (ใบแจ้งหนี้/ใบเสร็จ)
```
Invoice {
  id                  : UUID (PK)
  clinic_id           : UUID (FK → Clinic)
  visit_id            : UUID (FK → Visit)
  patient_id          : UUID (FK → Patient)
  invoice_number      : String            -- เลขที่เอกสาร
  subtotal            : Decimal           -- ยอดรวมก่อนลด
  discount_amount     : Decimal           -- ส่วนลด
  vat_amount          : Decimal           -- ภาษี
  total_amount        : Decimal           -- ยอดรวมสุทธิ
  insurance_coverage  : Decimal           -- สิทธิครอบคลุม
  patient_pay         : Decimal           -- ผู้ป่วยจ่าย
  status              : Enum [Pending, Paid, PartialPaid, Cancelled, Refunded]
  notes               : Text
  created_by          : UUID (FK → User)
  created_at          : DateTime
  updated_at          : DateTime
}
```

### 25. InvoiceItem (รายการในใบแจ้งหนี้)
```
InvoiceItem {
  id                  : UUID (PK)
  invoice_id          : UUID (FK → Invoice)
  item_type           : Enum [Service, Drug, Lab, Procedure, Other]
  item_reference_id   : UUID             -- FK ไป Service/Drug/LabTest
  description         : String
  quantity            : Integer
  unit_price          : Decimal
  discount            : Decimal
  total_price         : Decimal
  created_at          : DateTime
}
```

### 26. Payment (การชำระเงิน)
```
Payment {
  id                  : UUID (PK)
  invoice_id          : UUID (FK → Invoice)
  payment_method      : Enum [Cash, Transfer, CreditCard, DebitCard, QRPromptPay]
  amount              : Decimal
  reference_number    : String            -- เลขอ้างอิง
  slip_url            : String            -- รูป slip
  change_amount       : Decimal           -- เงินทอน (กรณีเงินสด)
  paid_at             : DateTime
  received_by         : UUID (FK → User)
  created_at          : DateTime
}
```

### 27. Notification (การแจ้งเตือน)
```
Notification {
  id                  : UUID (PK)
  clinic_id           : UUID (FK → Clinic)
  recipient_type      : Enum [Patient, User]
  recipient_id        : UUID              -- FK ไป Patient หรือ User
  channel             : Enum [SMS, LINE, Email, InApp]
  event_type          : Enum [AppointmentReminder, QueueCall, LabReady, PaymentDue, General]
  title               : String
  message             : Text
  status              : Enum [Pending, Sent, Failed, Read]
  sent_at             : DateTime
  read_at             : DateTime
  created_at          : DateTime
}
```

### 28. DocumentHeader (หัวกระดาษเอกสาร)
```
DocumentHeader {
  id                  : UUID (PK)
  clinic_id           : UUID (FK → Clinic)
  document_type       : Enum [Receipt, Invoice, MedCertificate, Prescription, LabResult]
  logo_url            : String
  logo_position       : Enum [Left, Center, Right]
  header_line_1       : String
  header_line_2       : String
  header_line_3       : String
  header_line_4       : String
  footer_text         : String
  font_size           : Integer
  text_color          : String
  created_at          : DateTime
  updated_at          : DateTime
}
```

---

## Entity Relationship Diagram (Text-based)

```
┌──────────────────────────────────────────────────────────────────────┐
│                         MASTER DATA                                  │
│                                                                      │
│  ┌─────────┐    ┌──────┐    ┌─────────┐    ┌──────────────┐        │
│  │ Clinic  │───<│ User │    │ Service │    │InsurancePlan │        │
│  │         │    └──┬───┘    └────┬────┘    └──────┬───────┘        │
│  │         │───<┌──┴───────┐    │                 │                │
│  │         │    │ Patient  │────┘                  │                │
│  │         │    └──┬───────┘──────────────────────┘                │
│  │         │───<┌──┴──────────┐                                    │
│  │         │    │DrugAllergy  │                                    │
│  │         │    └─────────────┘                                    │
│  │         │───<┌──────┐    ┌─────────┐    ┌─────────────────┐    │
│  │         │    │ Drug │    │LabTest  │    │ExaminationRoom  │    │
│  └─────────┘    └──────┘    └─────────┘    └─────────────────┘    │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                      PATIENT FLOW                                    │
│                                                                      │
│  Patient ──→ Appointment ──→ Queue ──→ Visit                        │
│                                           │                          │
│              ┌────────────────────────────┼────────────────┐         │
│              │                            │                │         │
│              ▼                            ▼                ▼         │
│         Screening              MedicalRecord          LabOrder      │
│                                     │                     │         │
│                                     ▼                     ▼         │
│                                Diagnosis             LabResult      │
│                                     │                               │
│                                     ▼                               │
│                              Prescription ──→ Dispensing            │
│                                  │                │                  │
│                                  ▼                ▼                  │
│                          PrescriptionItem    DrugMovement           │
│                                                                      │
│              Visit ──→ Procedure                                    │
│              Visit ──→ Invoice ──→ InvoiceItem                      │
│                          │                                           │
│                          ▼                                           │
│                       Payment                                        │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Relationships Summary

### One-to-Many (1:N)

| Parent | Child | คำอธิบาย |
|--------|-------|----------|
| Clinic | User | คลินิกมีหลายผู้ใช้ |
| Clinic | Patient | คลินิกมีหลายผู้ป่วย |
| Clinic | Service | คลินิกมีหลายบริการ |
| Clinic | Drug | คลินิกมียาหลายรายการ |
| Clinic | LabTest | คลินิกมีรายการตรวจ Lab หลายรายการ |
| Clinic | ExaminationRoom | คลินิกมีหลายห้องตรวจ |
| Clinic | InsurancePlan | คลินิกมีหลายสิทธิการรักษา |
| Clinic | DocumentHeader | คลินิกมีหลายหัวกระดาษ |
| Clinic | Invoice | คลินิกมีหลายใบแจ้งหนี้ |
| Clinic | Notification | คลินิกมีหลายการแจ้งเตือน |
| Patient | DrugAllergy | ผู้ป่วยมีประวัติแพ้ยาหลายรายการ |
| Patient | Appointment | ผู้ป่วยมีหลายนัดหมาย |
| Patient | Queue | ผู้ป่วยมีหลายคิว |
| Patient | Visit | ผู้ป่วยมีหลาย visit |
| Visit | Screening | 1 visit มี 1 screening |
| Visit | MedicalRecord | 1 visit มี 1 เวชระเบียน |
| Visit | Diagnosis | 1 visit มีหลายการวินิจฉัย |
| Visit | Prescription | 1 visit มีใบสั่งยาได้หลายใบ |
| Visit | LabOrder | 1 visit มีหลายคำสั่งตรวจ Lab |
| Visit | Procedure | 1 visit มีหลายหัตถการ |
| Visit | Invoice | 1 visit มี 1 ใบแจ้งหนี้ |
| Prescription | PrescriptionItem | 1 ใบสั่งยามีหลายรายการยา |
| LabOrder | LabResult | 1 คำสั่งตรวจมี 1 ผล |
| Prescription | Dispensing | 1 ใบสั่งยามี 1 การจ่ายยา |
| Invoice | InvoiceItem | 1 ใบแจ้งหนี้มีหลายรายการ |
| Invoice | Payment | 1 ใบแจ้งหนี้มีหลายการชำระ |
| Drug | DrugStock | 1 ยามีหลาย lot |
| DrugStock | DrugMovement | 1 lot มีหลายการเคลื่อนไหว |

### Many-to-One (N:1 / Foreign Keys)

| Entity | References | Field | คำอธิบาย |
|--------|-----------|-------|----------|
| User | Clinic | clinic_id | ผู้ใช้สังกัดคลินิก |
| Patient | InsurancePlan | insurance_plan_id | สิทธิการรักษาของผู้ป่วย |
| Appointment | Patient | patient_id | นัดหมายของผู้ป่วย |
| Appointment | User (Doctor) | doctor_id | แพทย์ที่นัดพบ |
| Appointment | Service | service_id | บริการที่นัด |
| Queue | Patient | patient_id | คิวของผู้ป่วย |
| Queue | Appointment | appointment_id | คิวจากนัดหมาย |
| Queue | ExaminationRoom | room_id | ห้องตรวจที่ถูกส่ง |
| Visit | Patient | patient_id | visit ของผู้ป่วย |
| Visit | User (Doctor) | doctor_id | แพทย์ที่ตรวจ |
| Visit | Queue | queue_id | คิวที่เชื่อมโยง |
| Screening | Visit | visit_id | การคัดกรองของ visit |
| Screening | User (Nurse) | screened_by | พยาบาลที่คัดกรอง |
| MedicalRecord | Visit | visit_id | เวชระเบียนของ visit |
| MedicalRecord | User (Doctor) | doctor_id | แพทย์ผู้บันทึก |
| Diagnosis | Visit | visit_id | การวินิจฉัยของ visit |
| Diagnosis | MedicalRecord | medical_record_id | เชื่อมเวชระเบียน |
| Prescription | Visit | visit_id | ใบสั่งยาของ visit |
| PrescriptionItem | Drug | drug_id | ยาที่สั่ง |
| LabOrder | LabTest | lab_test_id | รายการตรวจ |
| LabOrder | User (Doctor) | doctor_id | แพทย์ผู้สั่ง |
| LabResult | LabOrder | lab_order_id | ผลของคำสั่งตรวจ |
| LabResult | User | performed_by | นักเทคนิค |
| Procedure | Service | service_id | บริการหัตถการ |
| Dispensing | Prescription | prescription_id | การจ่ายยาของใบสั่ง |
| Dispensing | User (Pharmacist) | dispensed_by | เภสัชกรผู้จ่าย |
| Invoice | Visit | visit_id | ใบแจ้งหนี้ของ visit |
| Payment | Invoice | invoice_id | การชำระของใบแจ้งหนี้ |
| ExaminationRoom | User (Doctor) | assigned_doctor_id | แพทย์ประจำห้อง |

---

## Patient Flow Diagram

```
ผู้ป่วยมาถึงคลินิก
       │
       ▼
┌─────────────────┐     ┌──────────────────┐
│ PatientRegistra │────→│   PatientList    │
│ tion (ลงทะเบียน)│     │ (ค้นหาผู้ป่วยเก่า) │
└───────┬─────────┘     └────────┬─────────┘
        │                        │
        └──────────┬─────────────┘
                   ▼
        ┌─────────────────┐
        │   Appointments  │ (ถ้ามีนัดหมาย)
        │   (นัดหมาย)     │
        └────────┬────────┘
                 ▼
        ┌─────────────────┐
        │      Queue      │
        │   (รับคิว)      │
        └────────┬────────┘
                 ▼
        ┌─────────────────┐
        │   Screening     │
        │ (คัดกรอง/Vital) │
        └────────┬────────┘
                 ▼
        ┌─────────────────┐
        │ DoctorWorkbench │──→ LabOrder ──→ LabResult
        │ (พบแพทย์/วินิจฉัย)│
        │                 │──→ Prescription
        │                 │──→ Procedure
        └────────┬────────┘
                 ▼
        ┌─────────────────┐
        │    Pharmacy     │
        │   (รับยา)       │
        └────────┬────────┘
                 ▼
        ┌─────────────────┐
        │    Finance      │
        │  (ชำระเงิน)     │
        └────────┬────────┘
                 ▼
           เสร็จสิ้น ✅
```

---

## Role-Based Access Matrix

| Page/Function | Admin | Doctor | Nurse | Pharmacist | Cashier | Receptionist |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| PatientRegistration | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ |
| PatientList | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| PatientProfile | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Appointments | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Q (Queue) | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ |
| QueueDisplay | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| QueueDisplayPublic | 🌐 | 🌐 | 🌐 | 🌐 | 🌐 | 🌐 |
| Screening | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| DoctorWorkbench | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| ExaminationRooms | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| MedicalRecordsEditor | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| LabResults | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Pharmacy | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Finance | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| FinanceSettings | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Reports | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| ClinicInfo | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| ClinicPublic | 🌐 | 🌐 | 🌐 | 🌐 | 🌐 | 🌐 |
| ClinicSettings | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| DocumentHeaders | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| NotificationSettings | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Services | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| UserSettings | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

✅ = Full Access | ❌ = No Access | 🌐 = Public (No Login Required)
