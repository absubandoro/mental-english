/**
 * Seed data demo platform Nofosys: klien Mental English (+ klien contoh kedua) dan akun pengelola platform.
 *   npm run seed            -> isi data jika database masih kosong
 *   npm run seed -- --reset -> hapus semua data lalu isi ulang
 *   npm run seed -- --kosong -> hapus semua data, sisakan cabang Pusat + Super Admin (butuh SEED_PASSWORD)
 * Di server: cd backend && node dist/seed.js [--reset|--kosong]
 */
import 'reflect-metadata';
import * as bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import {
  Attendance, AttendanceStatus, Branch, CalendarEvent, CalendarEventType, ClassRoom, ClassSchedule, ClassSession, Enrollment, EnrollmentStatus,
  ExamResult, Mading, Notification, NotificationRecipient, NotificationTarget, Organization, Payment, PlatformAdmin, PaymentSource, PaymentStatus, Post, PostType,
  ProgressReport, ReportStatus, Role, SessionType, User,
} from './entities';
import { addDays, dayOfWeek, slugify, todayLocal } from './common/util';
import { summarizeSchedule } from './classes/classes';
import { DEFAULT_SKILLS } from './reports/reports';
import { dataSourceOptions } from './data-source';

config();

const ds = new DataSource(dataSourceOptions);

// Password akun demo. Di server, set SEED_PASSWORD agar tidak memakai password bawaan.
const DEFAULT_PASSWORD = process.env.SEED_PASSWORD || 'password123';

const MADING_SAMPLES = [
  {
    title: 'My Dream Job',
    category: 'Karya Tulis',
    content: 'When I grow up, I want to be a pilot. I want to fly around the world and talk to people from many countries. That is why I study English every week. My teacher says practice makes perfect!',
  },
  {
    title: 'A Day at the Beach',
    category: 'Cerita',
    content: 'Last holiday, my family went to the beach. We built a big sandcastle and found three tiny crabs. I tried to describe everything in English to my little brother. He laughed, but he learned new words too!',
  },
  {
    title: 'Rainy Morning',
    category: 'Puisi',
    content: 'Pitter patter on my window,\nGrey clouds dancing slow,\nI open my English book,\nAnd watch my brave words grow.',
  },
  {
    title: 'Why Mistakes Are Good',
    category: 'Opini',
    content: 'I used to be afraid of speaking English because I made mistakes. Now I think mistakes are good, because every mistake teaches me something new. Being brave is more important than being perfect.',
  },
];

/** N kemunculan terakhir (sebelum hari ini) dari hari-hari jadwal, urut lama -> baru */
function pastClassDays(days: number[], count: number) {
  const out: string[] = [];
  for (let d = addDays(todayLocal(), -1); out.length < count; d = addDays(d, -1)) {
    if (days.includes(dayOfWeek(d))) out.unshift(d);
  }
  return out;
}

/** Kemunculan berikutnya (>= hari ini + offset) dari hari jadwal */
function nextClassDay(days: number[], offset: number) {
  for (let d = addDays(todayLocal(), offset); ; d = addDays(d, 1)) if (days.includes(dayOfWeek(d))) return d;
}

function monthOffset(n: number) {
  const d = new Date();
  d.setMonth(d.getMonth() + n, 1);
  return d.toISOString().slice(0, 7);
}

/** Organisasi pertama (Mental English). Dibuat juga oleh migrasi; dibuat ulang setelah --reset / --kosong. */
const MENTAL_ENGLISH: Partial<Organization> = {
  slug: 'mental-english',
  name: 'Mental English',
  tagline: 'Build Your Mental Focus!',
  description: 'Kursus bahasa Inggris yang melatih keberanian berbicara, fokus, dan kepercayaan diri. Orang tua dapat memantau absensi, hasil ujian, dan pembayaran anak secara langsung.',
  logoUrl: '/logo.png',
  brandColor: '#3d8ccf',
  photos: { welcome: '/landing/welcome.jpg', holiday: '/landing/holiday.jpg', team: '/landing/team.jpg' },
  email: 'info@mentalenglish.id',
};

async function ensureOrg(data: Partial<Organization>) {
  const repo = ds.getRepository(Organization);
  return (await repo.findOneBy({ slug: data.slug })) ?? repo.save(repo.create(data));
}

/** Akun pengelola platform Nofosys (panel http://platform.localhost:3000/platform) */
const PLATFORM_EMAIL = process.env.SEED_PLATFORM_EMAIL || 'owner@nofosys.id';
async function seedPlatformAdmin(passwordHash: string) {
  const repo = ds.getRepository(PlatformAdmin);
  if (!(await repo.existsBy({ email: PLATFORM_EMAIL }))) await repo.save(repo.create({ name: 'Pengelola Nofosys', email: PLATFORM_EMAIL, password: passwordHash }));
}

/** Klien contoh kedua — untuk mencoba pemisahan data antar-lembaga (buka http://kursus-contoh.localhost:3000) */
async function seedSecondOrg(password: string) {
  const org = await ensureOrg({
    slug: 'kursus-contoh',
    name: 'Kursus Contoh',
    tagline: 'Belajar Seru, Nilai Melaju!',
    description: 'Klien contoh kedua di platform Nofosys. Datanya terpisah penuh dari Mental English.',
    logoUrl: null,
    brandColor: '#16a34a',
    // Tanpa foto: landing memakai gradasi warna merek sampai foto diunggah lewat Identitas Lembaga
    photos: {},
    email: 'halo@kursuscontoh.id',
  });
  const branch = await ds.getRepository(Branch).save(
    ds.getRepository(Branch).create({
      organizationId: org.id,
      name: 'Kursus Contoh Depok',
      slug: 'kursus-contoh-depok',
      city: 'Depok',
      address: 'Jl. Contoh Margonda No. 10, Depok',
      mapQuery: 'Margonda, Depok',
      phone: '0812-0000-0099',
      openHours: 'Senin–Jumat, 14.00–20.00',
    }),
  );
  const users = ds.getRepository(User);
  const mk = (d: Partial<User>) => users.save(users.create({ password, organizationId: org.id, ...d }));
  await mk({ name: 'Super Admin', email: 'superadmin@kursuscontoh.id', role: Role.SUPER_ADMIN });
  const admin = await mk({ name: 'Admin Depok', email: 'admin@kursuscontoh.id', role: Role.ADMIN, branchId: branch.id });
  await mk({ name: 'Kak Dina', email: 'pengajar@kursuscontoh.id', role: Role.TEACHER, branchId: branch.id });
  const parent = await mk({ name: 'Ibu Sari', email: 'ortu@kursuscontoh.id', role: Role.PARENT, branchId: branch.id, phone: '0812-0000-0100' });
  await mk({ name: 'Raka', email: 'raka@kursuscontoh.id', role: Role.STUDENT, branchId: branch.id, parentId: parent.id, level: 'SD Kelas 5' });
  await ds.getRepository(Post).save(
    ds.getRepository(Post).create({
      branchId: branch.id,
      authorId: admin.id,
      type: PostType.BLOG,
      title: 'Selamat Datang di Kursus Contoh',
      slug: 'selamat-datang-di-kursus-contoh',
      excerpt: 'Artikel ini hanya muncul di website Kursus Contoh, bukan di Mental English.',
      content: 'Kursus Contoh memakai platform Nofosys yang sama dengan Mental English, tetapi data, tampilan, dan akunnya terpisah penuh.',
    }),
  );
}

async function main() {
  await ds.initialize();
  // Pastikan skema ada: migrasi (production) atau sinkronisasi (development)
  if (!dataSourceOptions.synchronize) await ds.runMigrations();
  const reset = process.argv.includes('--reset');
  const users = ds.getRepository(User);

  const truncateAll = async () => {
    const tables = ds.entityMetadatas.map((m) => `"${m.tableName}"`).join(', ');
    await ds.query(`TRUNCATE ${tables}, "class_students", "class_teachers" RESTART IDENTITY CASCADE`);
  };

  // --kosong : hapus SEMUA data, sisakan cabang Pusat + 1 akun Super Admin (untuk mulai pakai sungguhan)
  if (process.argv.includes('--kosong')) {
    if (!process.env.SEED_PASSWORD || process.env.SEED_PASSWORD.length < 8) {
      throw new Error('Set SEED_PASSWORD (minimal 8 karakter) untuk password Super Admin.');
    }
    await truncateAll();
    const org = await ensureOrg(MENTAL_ENGLISH);
    const branchRepo = ds.getRepository(Branch);
    const pusat = { name: 'Mental English Pusat', city: 'Bekasi', address: 'Jatimurni, Pondok Melati, Kota Bekasi, Jawa Barat' };
    await branchRepo.save(branchRepo.create({ ...pusat, organizationId: org.id, slug: slugify(pusat.name), mapQuery: pusat.address }));
    await users.save(
      users.create({
        name: 'Super Admin',
        email: 'superadmin@mentalenglish.id',
        role: Role.SUPER_ADMIN,
        organizationId: org.id,
        password: await bcrypt.hash(process.env.SEED_PASSWORD, 10),
      }),
    );
    await seedPlatformAdmin(await bcrypt.hash(process.env.SEED_PASSWORD, 10));
    console.log('Semua data dihapus. Tersisa lembaga Mental English (cabang Pusat + Super Admin superadmin@mentalenglish.id)');
    console.log(`dan pengelola platform ${PLATFORM_EMAIL}. Password keduanya = SEED_PASSWORD.`);
    return ds.destroy();
  }

  if (reset) {
    await truncateAll();
    console.log('Database dikosongkan.');
  } else if (await users.count()) {
    console.log('Data sudah ada. Jalankan "npm run seed -- --reset" untuk mengisi ulang.');
    return ds.destroy();
  }

  const org = await ensureOrg(MENTAL_ENGLISH);
  const password = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  const mk = (data: Partial<User>) => users.save(users.create({ password, organizationId: org.id, ...data }));

  const branchRepo = ds.getRepository(Branch);
  // Pusat = alamat asli. Cabang lain masih CONTOH (belum ada) — ganti lewat menu Cabang.
  const branchData = [
    { name: 'Mental English Pusat', city: 'Bekasi', address: 'Jatimurni, Pondok Melati, Kota Bekasi, Jawa Barat', phone: '0812-0000-0001', openHours: 'Senin–Sabtu, 08.00–20.00' },
    { name: 'Mental English Bandung (Contoh)', city: 'Bandung', address: 'Jl. Contoh Dago No. 25, Coblong, Bandung', phone: '0812-0000-0002', openHours: 'Senin–Sabtu, 09.00–19.00' },
    { name: 'Mental English Surabaya (Contoh)', city: 'Surabaya', address: 'Jl. Contoh Darmo No. 7, Wonokromo, Surabaya', phone: '0812-0000-0003', openHours: 'Senin–Jumat, 13.00–20.00' },
  ];
  const branches: Branch[] = [];
  for (const b of branchData) {
    branches.push(
      await branchRepo.save(
        branchRepo.create({
          ...b,
          organizationId: org.id,
          slug: slugify(b.name),
          mapQuery: b.address,
          billingEnabled: b.name.includes('Pusat'),
          billingDay: 5,
          billingAmount: 450000,
          billingDescription: 'SPP Bulanan',
          billingDueDays: 10,
          bankAccounts: [{ bank: 'BCA', number: '1234567890', holder: 'Mental English (contoh)' }],
          paymentInstructions: 'Cantumkan nama siswa pada berita transfer. Unggah bukti transfer di menu Pembayaran agar segera diverifikasi.',
        }),
      ),
    );
  }

  await mk({ name: 'Super Admin', email: 'superadmin@mentalenglish.id', role: Role.SUPER_ADMIN });

  const firstNames = ['Aisyah', 'Bima', 'Citra', 'Dimas', 'Elsa', 'Fajar', 'Gita', 'Hafiz', 'Intan', 'Joko', 'Kirana', 'Lutfi'];
  const postRepo = ds.getRepository(Post);
  const madingRepo = ds.getRepository(Mading);
  const classRepo = ds.getRepository(ClassRoom);
  const sessionRepo = ds.getRepository(ClassSession);
  const paymentRepo = ds.getRepository(Payment);
  const notifRepo = ds.getRepository(Notification);
  const recipientRepo = ds.getRepository(NotificationRecipient);
  const eventRepo = ds.getRepository(CalendarEvent);
  const reportRepo = ds.getRepository(ProgressReport);
  const enrollRepo = ds.getRepository(Enrollment);
  const attRepo = ds.getRepository(Attendance);
  const examRepo = ds.getRepository(ExamResult);

  for (const [bi, branch] of branches.entries()) {
    const code = ['pusat', 'bandung', 'surabaya'][bi];
    const admin = await mk({ name: `Admin ${branch.city}`, email: `admin.${code}@mentalenglish.id`, role: Role.ADMIN, branchId: branch.id });
    const finance = await mk({ name: `Keuangan ${branch.city}`, email: `keuangan.${code}@mentalenglish.id`, role: Role.FINANCE, branchId: branch.id });
    const teachers = [
      await mk({ name: `Miss ${['Rina', 'Sarah', 'Nadia'][bi]}`, email: `teacher1.${code}@mentalenglish.id`, role: Role.TEACHER, branchId: branch.id, bio: 'Pengajar speaking & grammar' }),
      await mk({ name: `Mr. ${['Andi', 'Bayu', 'Reza'][bi]}`, email: `teacher2.${code}@mentalenglish.id`, role: Role.TEACHER, branchId: branch.id, bio: 'Pengajar vocabulary & listening' }),
    ];

    const students: User[] = [];
    for (let i = 0; i < 4; i++) {
      const n = firstNames[(bi * 4 + i) % firstNames.length];
      const parent = await mk({
        name: `Orang Tua ${n}`,
        email: `ortu.${n.toLowerCase()}@mentalenglish.id`,
        role: Role.PARENT,
        branchId: branch.id,
        phone: `0813-11${bi}${i}-0000`,
      });
      students.push(
        await mk({
          name: `${n} ${['Pratama', 'Lestari', 'Saputra', 'Wulandari'][i]}`,
          email: `${n.toLowerCase()}@mentalenglish.id`,
          role: Role.STUDENT,
          branchId: branch.id,
          parentId: parent.id,
          school: `SD/SMP Contoh ${i + 1}`,
          level: i < 2 ? 'Kids' : 'Teens',
          birthDate: `201${2 + i}-0${i + 1}-15`,
          // Contoh SPP khusus (diskon saudara)
          monthlyFee: i === 3 ? 400000 : null,
        }),
      );
    }

    const slots = (days: number[], startTime: string, endTime: string) =>
      days.map((dayOfWeek) => Object.assign(new ClassSchedule(), { dayOfWeek, startTime, endTime, room: 'Ruang 1' }));
    const kidsSlots = slots([1, 3], '15:30', '17:00');
    const teensSlots = slots([2, 4], '16:00', '17:30');
    const kids = await classRepo.save(
      classRepo.create({ name: 'Kids Explorer A', level: 'Kids', schedule: summarizeSchedule(kidsSlots), schedules: kidsSlots, branchId: branch.id, students: students.slice(0, 2), teachers: [teachers[0]] }),
    );
    const teens = await classRepo.save(
      classRepo.create({ name: 'Teens Speaking B', level: 'Teens', schedule: summarizeSchedule(teensSlots), schedules: teensSlots, branchId: branch.id, students: students.slice(2), teachers: [teachers[1]] }),
    );
    const classDays = [[1, 3], [2, 4]];

    for (const [ci, cls] of [kids, teens].entries()) {
      const teacher = teachers[ci];
      const plan: [SessionType, string][] = [
        [SessionType.BELAJAR, 'Daily Routines & Simple Present'],
        [SessionType.OUTDOOR, 'Outdoor Speaking: Ordering at a Café'],
        [SessionType.BELAJAR, 'Describing People'],
        [SessionType.UJIAN, 'Monthly Test — Unit 1-3'],
      ];
      const dates = pastClassDays(classDays[ci], plan.length);
      for (const [k, [type, topic]] of plan.entries()) {
        const statuses = [AttendanceStatus.HADIR, AttendanceStatus.HADIR, AttendanceStatus.IZIN, AttendanceStatus.SAKIT, AttendanceStatus.ALPA];
        await sessionRepo.save(
          sessionRepo.create({
            classId: cls.id,
            teacherId: teacher.id,
            date: dates[k],
            type,
            topic,
            media: type === SessionType.OUTDOOR
              ? [{ url: '/landing/team.jpg', type: 'image' as const, name: 'outdoor-1.jpg' }, { url: '/landing/holiday.jpg', type: 'image' as const, name: 'outdoor-2.jpg' }]
              : [],
            report: type === SessionType.UJIAN
              ? 'Ujian berjalan lancar. Sebagian besar pelajar sudah percaya diri saat sesi speaking.'
              : 'Pelajar aktif berdiskusi. Perlu latihan pengucapan pada beberapa kosakata baru.',
            attendances: cls.students.map((s, si) =>
              Object.assign(new Attendance(), { studentId: s.id, status: (k + si) % 4 === 3 ? statuses[(k + si) % statuses.length] : AttendanceStatus.HADIR }),
            ),
            examResults: type === SessionType.UJIAN
              ? cls.students.map((s, si) => Object.assign(new ExamResult(), { studentId: s.id, score: 72 + ((si * 7 + bi * 3) % 25), grade: 'B+', note: 'Pertahankan latihan speaking setiap hari.' }))
              : [],
          }),
        );
      }
    }

    for (const [si, s] of students.entries()) {
      for (const m of [-2, -1, 0]) {
        // Bulan ini: 0 = menunggu verifikasi (ada bukti), 1 = belum bayar, 2 = bukti ditolak, 3 = belum bayar
        const status = m < 0 ? PaymentStatus.LUNAS : si === 0 ? PaymentStatus.MENUNGGU : PaymentStatus.BELUM_BAYAR;
        await paymentRepo.save(
          paymentRepo.create({
            studentId: s.id,
            branchId: branch.id,
            period: monthOffset(m),
            description: 'SPP Bulanan',
            amount: s.monthlyFee ?? 450000,
            status,
            source: m === 0 ? PaymentSource.AUTO : PaymentSource.MANUAL,
            dueDate: `${monthOffset(m)}-15`,
            paidAt: status === PaymentStatus.LUNAS ? new Date(`${monthOffset(m)}-08T10:00:00Z`) : null,
            method: status === PaymentStatus.LUNAS ? 'Transfer Bank' : si === 0 && m === 0 ? 'Transfer BCA' : null,
            verifiedById: status === PaymentStatus.LUNAS ? finance.id : null,
            verifiedAt: status === PaymentStatus.LUNAS ? new Date(`${monthOffset(m)}-08T12:00:00Z`) : null,
            ...(m === 0 && si === 0
              ? { proofUrl: '/samples/bukti-transfer.png', proofNote: 'Transfer dari rekening ayah', proofUploadedAt: new Date() }
              : {}),
            ...(m === 0 && si === 2
              ? { proofUrl: '/samples/bukti-transfer.png', proofUploadedAt: new Date(), rejectionReason: 'Nominal transfer tidak sesuai tagihan', verifiedById: finance.id, verifiedAt: new Date() }
              : {}),
          }),
        );
      }
    }

    // Agenda kalender cabang
    const holiday = nextClassDay([1, 2, 3, 4], 6);
    await eventRepo.save([
      eventRepo.create({ title: 'Libur Cabang', description: 'Kegiatan kelas diliburkan.', type: CalendarEventType.LIBUR, startDate: holiday, endDate: holiday, branchId: branch.id, createdById: admin.id }),
      eventRepo.create({ title: 'Speaking Day', description: 'Pentas speaking seluruh pelajar. Orang tua dipersilakan hadir.', type: CalendarEventType.ACARA, startDate: addDays(todayLocal(), 11), endDate: addDays(todayLocal(), 11), startTime: '09:00', endTime: '12:00', branchId: branch.id, createdById: admin.id }),
      eventRepo.create({ title: 'Ujian Bulanan Kids', type: CalendarEventType.UJIAN, startDate: nextClassDay([1, 3], 14), endDate: nextClassDay([1, 3], 14), startTime: '15:30', endTime: '17:00', classId: kids.id, branchId: branch.id, createdById: admin.id }),
    ]);

    // Rapor: terbit untuk pelajar pertama tiap kelas, draf untuk pelajar kedua
    const periodStart = addDays(todayLocal(), -30);
    const periodEnd = todayLocal();
    for (const [ci, cls] of [kids, teens].entries()) {
      for (const [k, st] of cls.students.entries()) {
        const atts = await attRepo.find({ where: { studentId: st.id }, relations: { session: true } });
        const c = { HADIR: 0, IZIN: 0, SAKIT: 0, ALPA: 0 } as Record<AttendanceStatus, number>;
        atts.forEach((a) => c[a.status]++);
        const ex = await examRepo.find({ where: { studentId: st.id }, relations: { session: true } });
        const scored = ex.filter((e) => e.score != null);
        const published = k === 0;
        await reportRepo.save(
          reportRepo.create({
            title: 'Rapor Perkembangan Bulanan',
            periodStart,
            periodEnd,
            studentId: st.id,
            classId: cls.id,
            branchId: branch.id,
            authorId: teachers[ci].id,
            skills: DEFAULT_SKILLS.map((sk, j) => ({ ...sk, score: published ? 70 + ((j * 7 + k * 5 + ci * 3) % 26) : null, note: published && j === 0 ? 'Sudah berani menjawab pertanyaan guru dengan kalimat lengkap.' : null })),
            overallGrade: published ? 'B+' : null,
            teacherComment: published ? `${st.name.split(' ')[0]} menunjukkan kemajuan yang baik, terutama keberanian berbicara di depan kelas. Kosakata bertambah dan semakin percaya diri saat kegiatan outdoor.` : null,
            recommendation: published ? 'Latihan membaca cerita pendek 10 menit setiap hari dan biasakan menjawab dengan kalimat lengkap.' : null,
            attendanceSummary: { total: atts.length, ...c, ratio: atts.length ? Math.round((c.HADIR / atts.length) * 1000) / 10 : null },
            examSummary: {
              count: ex.length,
              average: scored.length ? Math.round((scored.reduce((a, e) => a + (e.score ?? 0), 0) / scored.length) * 10) / 10 : null,
              items: ex.map((e) => ({ date: e.session.date, topic: e.session.topic, score: e.score, grade: e.grade })),
            },
            media: published ? [{ url: '/landing/team.jpg', type: 'image' as const, name: 'kegiatan.jpg' }] : [],
            status: published ? ReportStatus.PUBLISHED : ReportStatus.DRAFT,
            publishedAt: published ? new Date() : null,
          }),
        );
      }
    }

    // Pendaftaran siswa baru (menunggu ditinjau admin)
    const enrollPass = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    await enrollRepo.save([
      enrollRepo.create({ branchId: branch.id, studentName: `Nadia Putri ${code === 'pusat' ? '' : branch.city}`.trim(), studentBirthDate: '2016-04-12', studentSchool: 'SD Negeri Contoh', program: 'Kids', parentName: 'Ibu Rahma', parentPhone: '0812-3456-7890', parentEmail: `rahma.${code}@contoh.id`, passwordHash: enrollPass, notes: 'Ingin ikut kelas percobaan hari Sabtu.', status: EnrollmentStatus.BARU }),
      enrollRepo.create({ branchId: branch.id, studentName: `Rafi Aditya ${code === 'pusat' ? '' : branch.city}`.trim(), studentBirthDate: '2012-09-03', studentSchool: 'SMP Contoh', program: 'Teens', parentName: 'Bapak Hendra', parentPhone: '0813-2222-3333', parentEmail: `hendra.${code}@contoh.id`, passwordHash: enrollPass, status: EnrollmentStatus.DIHUBUNGI, adminNote: 'Sudah ditelepon, menunggu jadwal tes penempatan.' }),
    ]);

    const blogTitles = [
      [PostType.BLOG, `5 Cara Melatih Mental Berbicara Bahasa Inggris`, 'Rasa takut salah adalah penghalang terbesar. Berikut lima kebiasaan kecil yang membangun keberanian berbicara.'],
      [PostType.BLOG, `Kegiatan Outdoor Class di ${branch.city}`, 'Belajar tidak harus di dalam kelas. Pelajar kami praktik langsung di tempat umum.'],
      [PostType.VLOG, `Vlog: Serunya Speaking Day ${branch.city}`, 'Cuplikan kegiatan Speaking Day bersama pelajar dan pengajar.'],
    ] as const;
    // Foto kegiatan (disajikan frontend dari /public/landing). Artikel tips memakai ilustrasi otomatis.
    const covers = [null, '/landing/team.jpg', '/landing/holiday.jpg'];
    for (const [ti, [type, title, excerpt]] of blogTitles.entries()) {
      await postRepo.save(
        postRepo.create({
          type,
          title,
          excerpt,
          slug: `${slugify(title)}-${code}`,
          content: `${excerpt}\n\nDi Mental English, kami percaya bahwa kemampuan bahasa tumbuh bersama mental yang kuat dan fokus yang terlatih. Setiap pertemuan dirancang agar pelajar berani mencoba, berani salah, dan terus memperbaiki diri.\n\n## Apa yang kami lakukan\n\n- Latihan speaking singkat setiap pertemuan\n- Permainan kosakata untuk melatih fokus\n- Refleksi bersama di akhir kelas\n\nSampai jumpa di kelas berikutnya!`,
          coverUrl: covers[ti],
          media: ti === 1 ? [{ url: '/landing/team.jpg', type: 'image' as const }, { url: '/landing/welcome.jpg', type: 'image' as const }] : [],
          videoUrl: null, // isi dengan URL YouTube vlog Anda
          branchId: branch.id,
          authorId: admin.id,
        }),
      );
    }

    for (const [si, s] of students.entries()) {
      await madingRepo.save(
        madingRepo.create({
          ...MADING_SAMPLES[(si + bi) % MADING_SAMPLES.length],
          branchId: branch.id,
          authorId: s.id,
        }),
      );
    }

    const n = await notifRepo.save(
      notifRepo.create({
        title: 'Selamat datang di Mental English!',
        body: `Pantau absensi, hasil ujian, dan pembayaran anak Anda di ${branch.name} langsung dari dashboard orang tua.`,
        target: NotificationTarget.BRANCH_PARENTS,
        branchId: branch.id,
        createdById: admin.id,
      }),
    );
    const parentIds = students.map((s) => s.parentId!);
    await recipientRepo.insert(parentIds.map((userId) => ({ notificationId: n.id, userId })));
  }

  await seedSecondOrg(password);
  await seedPlatformAdmin(password);

  console.log('\nSeed selesai. Password semua akun demo:', DEFAULT_PASSWORD);
  console.log('  Super admin : superadmin@mentalenglish.id');
  console.log('  Admin       : admin.pusat@mentalenglish.id   (login pilih cabang "Mental English Pusat")');
  console.log('  Keuangan    : keuangan.pusat@mentalenglish.id (login pilih cabang "Mental English Pusat")');
  console.log('  Pengajar    : teacher1.pusat@mentalenglish.id (login pilih cabang "Mental English Pusat")');
  console.log('  Orang tua   : ortu.aisyah@mentalenglish.id');
  console.log('  Pelajar     : aisyah@mentalenglish.id');
  console.log('Klien contoh "Kursus Contoh" (http://kursus-contoh.localhost:3000): superadmin@kursuscontoh.id, admin@kursuscontoh.id, ortu@kursuscontoh.id');
  console.log(`Panel pengelola Nofosys (http://platform.localhost:3000/platform): ${PLATFORM_EMAIL}`);
  await ds.destroy();
}

main().catch(async (e) => {
  console.error(e);
  await ds.destroy().catch(() => undefined);
  process.exit(1);
});
