import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clinic
  const clinic = await prisma.clinic.create({
    data: {
      nameTh: "กานต์คลินิก",
      nameEn: "Kan Clinic",
      licenseNumber: "CL-10001",
      clinicType: "general",
      address: "123 ถ.สุขุมวิท",
      subDistrict: "คลองเตย",
      district: "คลองเตย",
      province: "กรุงเทพมหานคร",
      postalCode: "10110",
      phone: "02-123-4567",
      email: "info@kanclinic.com",
    },
  });

  // Users
  const admin = await prisma.user.create({
    data: {
      clinicId: clinic.id,
      email: "admin@kanclinic.com",
      firstName: "แอดมิน",
      lastName: "ระบบ",
      role: "Admin",
      phone: "081-111-1111",
    },
  });

  const doctor1 = await prisma.user.create({
    data: {
      clinicId: clinic.id,
      email: "dr.somchai@kanclinic.com",
      firstName: "สมชาย",
      lastName: "รักษาดี",
      role: "Doctor",
      licenseNumber: "ว.12345",
      specialization: "อายุรกรรม",
      phone: "081-222-2222",
    },
  });

  const doctor2 = await prisma.user.create({
    data: {
      clinicId: clinic.id,
      email: "dr.suda@kanclinic.com",
      firstName: "สุดา",
      lastName: "ใจดี",
      role: "Doctor",
      licenseNumber: "ว.67890",
      specialization: "กุมารเวชกรรม",
      phone: "081-333-3333",
    },
  });

  const nurse = await prisma.user.create({
    data: {
      clinicId: clinic.id,
      email: "nurse.nid@kanclinic.com",
      firstName: "นิด",
      lastName: "พยาบาล",
      role: "Nurse",
      phone: "081-444-4444",
    },
  });

  const pharmacist = await prisma.user.create({
    data: {
      clinicId: clinic.id,
      email: "pharm.lek@kanclinic.com",
      firstName: "เล็ก",
      lastName: "เภสัชกร",
      role: "Pharmacist",
      phone: "081-555-5555",
    },
  });

  const cashier = await prisma.user.create({
    data: {
      clinicId: clinic.id,
      email: "cashier.noi@kanclinic.com",
      firstName: "น้อย",
      lastName: "การเงิน",
      role: "Cashier",
      phone: "081-666-6666",
    },
  });

  const receptionist = await prisma.user.create({
    data: {
      clinicId: clinic.id,
      email: "recep.fah@kanclinic.com",
      firstName: "ฟ้า",
      lastName: "ต้อนรับ",
      role: "Receptionist",
      phone: "081-777-7777",
    },
  });

  // Insurance Plans
  const selfPay = await prisma.insurancePlan.create({
    data: { clinicId: clinic.id, name: "จ่ายเอง", type: "SelfPay" },
  });
  const uc = await prisma.insurancePlan.create({
    data: { clinicId: clinic.id, name: "บัตรทอง (UC)", type: "UC", discountPercent: 100 },
  });
  const ss = await prisma.insurancePlan.create({
    data: { clinicId: clinic.id, name: "ประกันสังคม", type: "SocialSecurity", discountPercent: 80 },
  });

  // Services
  const services = await Promise.all([
    prisma.service.create({ data: { clinicId: clinic.id, code: "SVC-001", nameTh: "ตรวจทั่วไป", nameEn: "General Checkup", category: "General", price: 300, durationMinutes: 15 } }),
    prisma.service.create({ data: { clinicId: clinic.id, code: "SVC-002", nameTh: "ตรวจเฉพาะทาง", nameEn: "Specialist Consultation", category: "Specialist", price: 500, durationMinutes: 30 } }),
    prisma.service.create({ data: { clinicId: clinic.id, code: "SVC-003", nameTh: "ทำแผล", nameEn: "Wound Dressing", category: "Procedure", price: 200, durationMinutes: 20 } }),
    prisma.service.create({ data: { clinicId: clinic.id, code: "SVC-004", nameTh: "ฉีดวัคซีน", nameEn: "Vaccination", category: "Vaccine", price: 800, durationMinutes: 10 } }),
  ]);

  // Drugs
  await Promise.all([
    prisma.drug.create({ data: { clinicId: clinic.id, code: "DRG-001", genericName: "Paracetamol", tradeName: "Tylenol", form: "Tablet", strength: "500mg", unit: "เม็ด", category: "ยาแก้ปวด", price: 2, cost: 0.5, minStock: 100 } }),
    prisma.drug.create({ data: { clinicId: clinic.id, code: "DRG-002", genericName: "Amoxicillin", tradeName: "Amoxil", form: "Capsule", strength: "500mg", unit: "แคปซูล", category: "ยาปฏิชีวนะ", price: 5, cost: 2, minStock: 50 } }),
    prisma.drug.create({ data: { clinicId: clinic.id, code: "DRG-003", genericName: "Omeprazole", tradeName: "Losec", form: "Capsule", strength: "20mg", unit: "แคปซูล", category: "ยาลดกรด", price: 8, cost: 3, minStock: 50 } }),
    prisma.drug.create({ data: { clinicId: clinic.id, code: "DRG-004", genericName: "Loratadine", tradeName: "Clarityne", form: "Tablet", strength: "10mg", unit: "เม็ด", category: "ยาแก้แพ้", price: 5, cost: 1.5, minStock: 50 } }),
    prisma.drug.create({ data: { clinicId: clinic.id, code: "DRG-005", genericName: "Metformin", tradeName: "Glucophage", form: "Tablet", strength: "500mg", unit: "เม็ด", category: "ยาเบาหวาน", price: 3, cost: 1, minStock: 100 } }),
  ]);

  // Lab Tests
  await Promise.all([
    prisma.labTest.create({ data: { clinicId: clinic.id, code: "LAB-001", nameTh: "ตรวจนับเม็ดเลือด (CBC)", nameEn: "Complete Blood Count", category: "Hematology", normalRange: "WBC 4,500-11,000", unit: "cells/mcL", price: 200 } }),
    prisma.labTest.create({ data: { clinicId: clinic.id, code: "LAB-002", nameTh: "น้ำตาลในเลือด (FBS)", nameEn: "Fasting Blood Sugar", category: "Chemistry", normalRange: "70-100", unit: "mg/dL", price: 100 } }),
    prisma.labTest.create({ data: { clinicId: clinic.id, code: "LAB-003", nameTh: "ตรวจปัสสาวะ (UA)", nameEn: "Urinalysis", category: "Urine", normalRange: "-", unit: "-", price: 100 } }),
  ]);

  // Examination Rooms
  await Promise.all([
    prisma.examinationRoom.create({ data: { clinicId: clinic.id, roomNumber: "1", roomName: "ห้องตรวจ 1", roomType: "ตรวจทั่วไป", assignedDoctorId: doctor1.id, status: "Available" } }),
    prisma.examinationRoom.create({ data: { clinicId: clinic.id, roomNumber: "2", roomName: "ห้องตรวจ 2", roomType: "ตรวจทั่วไป", assignedDoctorId: doctor2.id, status: "Available" } }),
    prisma.examinationRoom.create({ data: { clinicId: clinic.id, roomNumber: "3", roomName: "ห้องหัตถการ", roomType: "หัตถการ", status: "Available" } }),
  ]);

  // Patients
  const patients = await Promise.all([
    prisma.patient.create({
      data: {
        clinicId: clinic.id, hn: "KAN-20260301-0001", idCardNumber: "1100700123456", title: "นาย",
        firstNameTh: "สมศักดิ์", lastNameTh: "จริงใจ", firstNameEn: "Somsak", lastNameEn: "Jingjai",
        dateOfBirth: new Date("1985-03-15"), gender: "Male", bloodType: "A+", phone: "089-111-1111",
        address: "45 ซ.สุขุมวิท 21", subDistrict: "คลองเตยเหนือ", district: "วัฒนา", province: "กรุงเทพมหานคร", postalCode: "10110",
        insurancePlanId: selfPay.id, underlyingDiseases: '["ความดันโลหิตสูง"]',
        emergencyContactName: "สมหญิง จริงใจ", emergencyContactRelation: "ภรรยา", emergencyContactPhone: "089-222-2222",
      },
    }),
    prisma.patient.create({
      data: {
        clinicId: clinic.id, hn: "KAN-20260301-0002", idCardNumber: "1100700234567", title: "นาง",
        firstNameTh: "สมหญิง", lastNameTh: "ดีงาม", firstNameEn: "Somying", lastNameEn: "Deengam",
        dateOfBirth: new Date("1990-07-22"), gender: "Female", bloodType: "B+", phone: "089-333-3333",
        address: "78 ซ.ลาดพร้าว 15", subDistrict: "จอมพล", district: "จตุจักร", province: "กรุงเทพมหานคร", postalCode: "10900",
        insurancePlanId: uc.id, underlyingDiseases: '["เบาหวาน"]',
      },
    }),
    prisma.patient.create({
      data: {
        clinicId: clinic.id, hn: "KAN-20260301-0003", idCardNumber: "1100700345678", title: "นาย",
        firstNameTh: "วิชัย", lastNameTh: "แข็งแรง", firstNameEn: "Wichai", lastNameEn: "Kaengrang",
        dateOfBirth: new Date("1978-12-01"), gender: "Male", bloodType: "O+", phone: "089-444-4444",
        address: "12 ซ.รัชดา 36", subDistrict: "จันทรเกษม", district: "จตุจักร", province: "กรุงเทพมหานคร", postalCode: "10900",
        insurancePlanId: ss.id,
      },
    }),
    prisma.patient.create({
      data: {
        clinicId: clinic.id, hn: "KAN-20260302-0004", title: "นางสาว",
        firstNameTh: "พิมพ์ใจ", lastNameTh: "สวยงาม", dateOfBirth: new Date("1995-05-10"),
        gender: "Female", bloodType: "AB+", phone: "089-555-5555",
        insurancePlanId: selfPay.id,
      },
    }),
    prisma.patient.create({
      data: {
        clinicId: clinic.id, hn: "KAN-20260302-0005", title: "นาย",
        firstNameTh: "ประเสริฐ", lastNameTh: "มั่นคง", dateOfBirth: new Date("1960-01-20"),
        gender: "Male", bloodType: "O-", phone: "089-666-6666",
        insurancePlanId: uc.id, underlyingDiseases: '["ความดันโลหิตสูง","เบาหวาน","โรคหัวใจ"]',
      },
    }),
  ]);

  // Drug allergies
  await prisma.drugAllergy.create({
    data: { patientId: patients[0].id, drugName: "Aspirin", reaction: "ผื่นแดง ลมพิษ", severity: "Moderate", notedById: doctor1.id },
  });
  await prisma.drugAllergy.create({
    data: { patientId: patients[4].id, drugName: "Penicillin", reaction: "หายใจลำบาก บวม", severity: "Severe", notedById: doctor1.id },
  });

  // Today's appointments
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  await Promise.all([
    prisma.appointment.create({
      data: {
        clinicId: clinic.id, patientId: patients[0].id, doctorId: doctor1.id, serviceId: services[0].id,
        appointmentDate: today, appointmentTime: "09:00", durationMinutes: 15,
        status: "Confirmed", createdById: receptionist.id,
      },
    }),
    prisma.appointment.create({
      data: {
        clinicId: clinic.id, patientId: patients[1].id, doctorId: doctor1.id, serviceId: services[0].id,
        appointmentDate: today, appointmentTime: "09:30", durationMinutes: 15,
        status: "Scheduled", createdById: receptionist.id,
      },
    }),
    prisma.appointment.create({
      data: {
        clinicId: clinic.id, patientId: patients[2].id, doctorId: doctor2.id, serviceId: services[1].id,
        appointmentDate: today, appointmentTime: "10:00", durationMinutes: 30,
        status: "Scheduled", createdById: receptionist.id,
      },
    }),
  ]);

  // Today's queues
  await Promise.all([
    prisma.queue.create({
      data: {
        clinicId: clinic.id, patientId: patients[0].id, queueNumber: "A001",
        queueType: "Appointment", priority: "Normal", currentStation: "WaitDoctor", queueDate: today,
      },
    }),
    prisma.queue.create({
      data: {
        clinicId: clinic.id, patientId: patients[1].id, queueNumber: "A002",
        queueType: "Appointment", priority: "Normal", currentStation: "WaitScreening", queueDate: today,
      },
    }),
    prisma.queue.create({
      data: {
        clinicId: clinic.id, patientId: patients[3].id, queueNumber: "B001",
        queueType: "WalkIn", priority: "Normal", currentStation: "Screening", queueDate: today,
      },
    }),
    prisma.queue.create({
      data: {
        clinicId: clinic.id, patientId: patients[4].id, queueNumber: "B002",
        queueType: "WalkIn", priority: "Urgent", currentStation: "WaitScreening", queueDate: today,
      },
    }),
  ]);

  console.log("✅ Seed data created successfully!");
  console.log(`   Clinic: ${clinic.nameTh}`);
  console.log(`   Users: 7 (admin, 2 doctors, nurse, pharmacist, cashier, receptionist)`);
  console.log(`   Patients: 5`);
  console.log(`   Services: 4, Drugs: 5, Lab Tests: 3`);
  console.log(`   Rooms: 3, Appointments: 3, Queues: 4`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
