import { prisma } from "@/lib/prisma";
import { Phone, Mail, MapPin, Clock, Stethoscope, Users, Heart, Shield, MessageCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ClinicPublicPage() {
  const clinic = await prisma.clinic.findFirst();
  const services = await prisma.service.findMany({
    where: { isActive: true },
    take: 8,
  });
  const doctors = await prisma.user.findMany({
    where: { role: "Doctor", isActive: true },
  });

  // Parse operating hours safely
  let operatingHours: Record<string, string> = {};
  try {
    if (clinic?.operatingHours) {
      operatingHours = JSON.parse(clinic.operatingHours);
    }
  } catch {
    // fallback
  }

  const serviceCategoryIcons: Record<string, string> = {
    General: "🩺",
    Specialist: "👨‍⚕️",
    Procedure: "💉",
    Lab: "🔬",
    Vaccine: "💊",
    Other: "🏥",
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-gray-900">
              {clinic?.nameTh || "คลินิก"}
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-600">
            <a href="#about" className="hover:text-blue-600 transition-colors">เกี่ยวกับเรา</a>
            <a href="#services" className="hover:text-blue-600 transition-colors">บริการ</a>
            <a href="#doctors" className="hover:text-blue-600 transition-colors">ทีมแพทย์</a>
            <a href="#hours" className="hover:text-blue-600 transition-colors">เวลาทำการ</a>
            <a href="#contact" className="hover:text-blue-600 transition-colors">ติดต่อเรา</a>
          </div>
          {clinic?.phone && (
            <a
              href={`tel:${clinic.phone}`}
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Phone className="w-4 h-4" />
              โทรนัดหมาย
            </a>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15),_transparent_70%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/15 backdrop-blur rounded-full text-sm text-blue-100 mb-6">
              <Shield className="w-4 h-4" />
              คลินิกเวชกรรม
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              {clinic?.nameTh || "คลินิกของเรา"}
            </h1>
            {clinic?.nameEn && (
              <p className="text-xl text-blue-200 mb-4">{clinic.nameEn}</p>
            )}
            <p className="text-lg text-blue-100 leading-relaxed mb-8 max-w-2xl">
              ให้บริการดูแลสุขภาพอย่างครบวงจร ด้วยทีมแพทย์ผู้เชี่ยวชาญ
              เทคโนโลยีทันสมัย และการบริการด้วยหัวใจ
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="#contact"
                className="px-8 py-3 bg-white text-blue-700 rounded-xl font-semibold hover:bg-blue-50 transition-colors shadow-lg"
              >
                นัดหมายแพทย์
              </a>
              <a
                href="#services"
                className="px-8 py-3 bg-white/15 text-white rounded-xl font-semibold hover:bg-white/25 transition-colors backdrop-blur border border-white/20"
              >
                ดูบริการทั้งหมด
              </a>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "แพทย์ผู้เชี่ยวชาญ", value: `${doctors.length}+`, icon: Users },
              { label: "บริการ", value: `${services.length}+`, icon: Stethoscope },
              { label: "ปีประสบการณ์", value: "10+", icon: Shield },
              { label: "ผู้ป่วยไว้วางใจ", value: "5,000+", icon: Heart },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white/10 backdrop-blur rounded-xl p-4 text-center border border-white/10"
              >
                <stat.icon className="w-6 h-6 text-blue-200 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-blue-200">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" className="w-full">
            <path d="M0,80 C360,120 720,40 1080,80 C1260,100 1380,60 1440,80 L1440,120 L0,120 Z" fill="#f9fafb" />
          </svg>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">เกี่ยวกับคลินิก</h2>
            <div className="w-16 h-1 bg-blue-600 mx-auto mb-6 rounded-full" />
            <p className="text-gray-600 leading-relaxed text-lg">
              {clinic?.nameTh || "คลินิก"} มุ่งมั่นให้บริการทางการแพทย์ที่มีคุณภาพ
              ด้วยมาตรฐานระดับสากล ทีมแพทย์ผู้เชี่ยวชาญพร้อมดูแลสุขภาพของคุณ
              ด้วยเทคโนโลยีที่ทันสมัยและบริการที่อบอุ่น
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Heart,
                title: "ดูแลด้วยหัวใจ",
                desc: "ทีมงานที่เปี่ยมไปด้วยจิตบริการ พร้อมดูแลคุณเสมือนครอบครัว",
              },
              {
                icon: Stethoscope,
                title: "แพทย์ผู้เชี่ยวชาญ",
                desc: "ทีมแพทย์ที่ได้รับการรับรองจากแพทยสภา มีประสบการณ์และความชำนาญ",
              },
              {
                icon: Shield,
                title: "มาตรฐานสากล",
                desc: "การรักษาตามมาตรฐานสากล ด้วยอุปกรณ์ทางการแพทย์ที่ทันสมัย",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-5">
                  <item.icon className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">บริการของเรา</h2>
            <div className="w-16 h-1 bg-blue-600 mx-auto mb-6 rounded-full" />
            <p className="text-gray-600 text-lg">
              เรามีบริการทางการแพทย์หลากหลายเพื่อดูแลสุขภาพของคุณอย่างครบวงจร
            </p>
          </div>

          {services.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="group bg-gray-50 rounded-2xl p-6 hover:bg-blue-50 hover:shadow-md transition-all border border-gray-100 hover:border-blue-200"
                >
                  <div className="text-3xl mb-4">
                    {serviceCategoryIcons[service.category] || "🏥"}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-700 transition-colors">
                    {service.nameTh}
                  </h3>
                  {service.nameEn && (
                    <p className="text-sm text-gray-400 mb-2">{service.nameEn}</p>
                  )}
                  {service.description && (
                    <p className="text-sm text-gray-600 leading-relaxed mb-3">
                      {service.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    {service.price > 0 && (
                      <span className="text-blue-600 font-semibold">
                        {service.price.toLocaleString()} บาท
                      </span>
                    )}
                    {service.durationMinutes > 0 && (
                      <span className="text-gray-400">
                        {service.durationMinutes} นาที
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <Stethoscope className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>กำลังเตรียมข้อมูลบริการ</p>
            </div>
          )}
        </div>
      </section>

      {/* Doctors Section */}
      <section id="doctors" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">ทีมแพทย์ผู้เชี่ยวชาญ</h2>
            <div className="w-16 h-1 bg-blue-600 mx-auto mb-6 rounded-full" />
            <p className="text-gray-600 text-lg">
              พบกับทีมแพทย์ที่มีความรู้ความสามารถ พร้อมดูแลสุขภาพของคุณ
            </p>
          </div>

          {doctors.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {doctors.map((doctor) => (
                <div
                  key={doctor.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className="h-3 bg-gradient-to-r from-blue-500 to-blue-700" />
                  <div className="p-6 text-center">
                    <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600 mx-auto mb-4">
                      {doctor.firstName.charAt(0)}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {doctor.firstName} {doctor.lastName}
                    </h3>
                    {doctor.specialization && (
                      <p className="text-sm text-blue-600 font-medium mb-2">
                        {doctor.specialization}
                      </p>
                    )}
                    {doctor.licenseNumber && (
                      <p className="text-xs text-gray-400">
                        เลขที่ใบอนุญาต: {doctor.licenseNumber}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>กำลังเตรียมข้อมูลแพทย์</p>
            </div>
          )}
        </div>
      </section>

      {/* Operating Hours Section */}
      <section id="hours" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">เวลาทำการ</h2>
              <div className="w-16 h-1 bg-blue-600 mx-auto mb-6 rounded-full" />
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-8 border border-blue-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">ตารางเวลา</h3>
              </div>

              {Object.keys(operatingHours).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(operatingHours).map(([day, hours]) => (
                    <div
                      key={day}
                      className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                    >
                      <span className="text-gray-700 font-medium">{day}</span>
                      <span className="text-gray-600">{hours}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {[
                    { day: "จันทร์ - ศุกร์", hours: "08:00 - 20:00" },
                    { day: "เสาร์", hours: "09:00 - 17:00" },
                    { day: "อาทิตย์", hours: "09:00 - 15:00" },
                  ].map((item) => (
                    <div
                      key={item.day}
                      className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                    >
                      <span className="text-gray-700 font-medium">{item.day}</span>
                      <span className="text-gray-600">{item.hours}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                <p className="text-sm text-yellow-800">
                  * กรณีฉุกเฉิน สามารถติดต่อได้ตลอด 24 ชั่วโมง ผ่านหมายเลขโทรศัพท์ของคลินิก
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">ติดต่อเรา</h2>
            <div className="w-16 h-1 bg-blue-600 mx-auto mb-6 rounded-full" />
            <p className="text-gray-600 text-lg">
              หากมีข้อสงสัยหรือต้องการนัดหมายแพทย์ สามารถติดต่อเราได้ตามช่องทางด้านล่าง
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Phone */}
            <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Phone className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">โทรศัพท์</h3>
              {clinic?.phone ? (
                <a
                  href={`tel:${clinic.phone}`}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  {clinic.phone}
                </a>
              ) : (
                <p className="text-gray-400">-</p>
              )}
            </div>

            {/* Email */}
            <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Mail className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">อีเมล</h3>
              {clinic?.email ? (
                <a
                  href={`mailto:${clinic.email}`}
                  className="text-green-600 hover:text-green-700 font-medium text-sm"
                >
                  {clinic.email}
                </a>
              ) : (
                <p className="text-gray-400">-</p>
              )}
            </div>

            {/* Line OA */}
            <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-7 h-7 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Line OA</h3>
              {clinic?.lineOa ? (
                <p className="text-emerald-600 font-medium">{clinic.lineOa}</p>
              ) : (
                <p className="text-gray-400">-</p>
              )}
            </div>

            {/* Address */}
            <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">ที่อยู่</h3>
              {clinic?.address ? (
                <p className="text-sm text-gray-600 leading-relaxed">
                  {clinic.address}
                  {clinic.subDistrict && ` ต.${clinic.subDistrict}`}
                  {clinic.district && ` อ.${clinic.district}`}
                  {clinic.province && ` จ.${clinic.province}`}
                  {clinic.postalCode && ` ${clinic.postalCode}`}
                </p>
              ) : (
                <p className="text-gray-400">-</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-white">
                  {clinic?.nameTh || "คลินิก"}
                </p>
                {clinic?.nameEn && (
                  <p className="text-sm text-gray-400">{clinic.nameEn}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm">
              {clinic?.phone && (
                <a href={`tel:${clinic.phone}`} className="flex items-center gap-2 hover:text-white transition-colors">
                  <Phone className="w-4 h-4" />
                  {clinic.phone}
                </a>
              )}
              {clinic?.email && (
                <a href={`mailto:${clinic.email}`} className="flex items-center gap-2 hover:text-white transition-colors">
                  <Mail className="w-4 h-4" />
                  {clinic.email}
                </a>
              )}
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
            <p>
              &copy; {new Date().getFullYear()} {clinic?.nameTh || "คลินิก"} สงวนลิขสิทธิ์ | Powered by MediFlow Thai
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
