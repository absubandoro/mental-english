/**
 * Seed data demo Mental English.
 *   npm run seed            -> isi data jika database masih kosong
 *   npm run seed -- --reset -> hapus semua data lalu isi ulang
 */
import 'reflect-metadata';
import * as bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import {
  Attendance, AttendanceStatus, Branch, ClassRoom, ClassSession, ENTITIES, ExamResult, Mading, Notification, NotificationRecipient,
  NotificationTarget, Payment, PaymentStatus, Post, PostType, Role, SessionType, User,
} from './entities';
import { slugify } from './common/util';

config();

const ds = new DataSource({ type: 'postgres', url: process.env.DATABASE_URL, entities: ENTITIES, synchronize: true });

const DEFAULT_PASSWORD = 'password123';

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function monthOffset(n: number) {
  const d = new Date();
  d.setMonth(d.getMonth() + n, 1);
  return d.toISOString().slice(0, 7);
}

async function main() {
  await ds.initialize();
  const reset = process.argv.includes('--reset');
  const users = ds.getRepository(User);

  if (reset) {
    const tables = ds.entityMetadatas.map((m) => `"${m.tableName}"`).join(', ');
    await ds.query(`TRUNCATE ${tables}, "class_students", "class_teachers" RESTART IDENTITY CASCADE`);
    console.log('Database dikosongkan.');
  } else if (await users.count()) {
    console.log('Data sudah ada. Jalankan "npm run seed -- --reset" untuk mengisi ulang.');
    return ds.destroy();
  }

  const password = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  const mk = (data: Partial<User>) => users.save(users.create({ password, ...data }));

  const branchRepo = ds.getRepository(Branch);
  const branchData = [
    { name: 'Mental English Pusat', city: 'Jakarta Selatan', address: 'Jl. Contoh Raya No. 10, Kebayoran Baru, Jakarta Selatan', phone: '0812-0000-0001', openHours: 'Senin–Sabtu, 08.00–20.00' },
    { name: 'Mental English Bandung', city: 'Bandung', address: 'Jl. Contoh Dago No. 25, Coblong, Bandung', phone: '0812-0000-0002', openHours: 'Senin–Sabtu, 09.00–19.00' },
    { name: 'Mental English Surabaya', city: 'Surabaya', address: 'Jl. Contoh Darmo No. 7, Wonokromo, Surabaya', phone: '0812-0000-0003', openHours: 'Senin–Jumat, 13.00–20.00' },
  ];
  const branches: Branch[] = [];
  for (const b of branchData) {
    branches.push(await branchRepo.save(branchRepo.create({ ...b, slug: slugify(b.name), mapQuery: b.address })));
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

  for (const [bi, branch] of branches.entries()) {
    const code = ['pusat', 'bandung', 'surabaya'][bi];
    const admin = await mk({ name: `Admin ${branch.city}`, email: `admin.${code}@mentalenglish.id`, role: Role.ADMIN, branchId: branch.id });
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
        }),
      );
    }

    const kids = await classRepo.save(classRepo.create({ name: 'Kids Explorer A', level: 'Kids', schedule: 'Senin & Rabu, 15.30', branchId: branch.id, students: students.slice(0, 2), teachers: [teachers[0]] }));
    const teens = await classRepo.save(classRepo.create({ name: 'Teens Speaking B', level: 'Teens', schedule: 'Selasa & Kamis, 16.00', branchId: branch.id, students: students.slice(2), teachers: [teachers[1]] }));

    for (const [ci, cls] of [kids, teens].entries()) {
      const teacher = teachers[ci];
      const plan: [number, SessionType, string][] = [
        [14, SessionType.BELAJAR, 'Daily Routines & Simple Present'],
        [10, SessionType.OUTDOOR, 'Outdoor Speaking: Ordering at a Café'],
        [7, SessionType.BELAJAR, 'Describing People'],
        [3, SessionType.UJIAN, 'Monthly Test — Unit 1-3'],
      ];
      for (const [k, [ago, type, topic]] of plan.entries()) {
        const statuses = [AttendanceStatus.HADIR, AttendanceStatus.HADIR, AttendanceStatus.IZIN, AttendanceStatus.SAKIT, AttendanceStatus.ALPA];
        await sessionRepo.save(
          sessionRepo.create({
            classId: cls.id,
            teacherId: teacher.id,
            date: daysAgo(ago),
            type,
            topic,
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
        const status = m < 0 ? PaymentStatus.LUNAS : si % 2 ? PaymentStatus.BELUM_BAYAR : PaymentStatus.MENUNGGU;
        await paymentRepo.save(
          paymentRepo.create({
            studentId: s.id,
            branchId: branch.id,
            period: monthOffset(m),
            description: 'SPP Bulanan',
            amount: 450000,
            status,
            dueDate: `${monthOffset(m)}-10`,
            paidAt: status === PaymentStatus.LUNAS ? new Date(`${monthOffset(m)}-08T10:00:00Z`) : null,
            method: status === PaymentStatus.LUNAS ? 'Transfer Bank' : null,
          }),
        );
      }
    }

    const blogTitles = [
      [PostType.BLOG, `5 Cara Melatih Mental Berbicara Bahasa Inggris`, 'Rasa takut salah adalah penghalang terbesar. Berikut lima kebiasaan kecil yang membangun keberanian berbicara.'],
      [PostType.BLOG, `Kegiatan Outdoor Class di ${branch.city}`, 'Belajar tidak harus di dalam kelas. Pelajar kami praktik langsung di tempat umum.'],
      [PostType.VLOG, `Vlog: Serunya Speaking Day ${branch.city}`, 'Cuplikan kegiatan Speaking Day bersama pelajar dan pengajar.'],
    ] as const;
    for (const [type, title, excerpt] of blogTitles) {
      await postRepo.save(
        postRepo.create({
          type,
          title,
          excerpt,
          slug: `${slugify(title)}-${code}`,
          content: `${excerpt}\n\nDi Mental English, kami percaya bahwa kemampuan bahasa tumbuh bersama mental yang kuat dan fokus yang terlatih. Setiap pertemuan dirancang agar pelajar berani mencoba, berani salah, dan terus memperbaiki diri.\n\n## Apa yang kami lakukan\n\n- Latihan speaking singkat setiap pertemuan\n- Permainan kosakata untuk melatih fokus\n- Refleksi bersama di akhir kelas\n\nSampai jumpa di kelas berikutnya!`,
          coverUrl: null,
          videoUrl: null, // isi dengan URL YouTube vlog Anda
          branchId: branch.id,
          authorId: admin.id,
        }),
      );
    }

    for (const [si, s] of students.entries()) {
      await madingRepo.save(
        madingRepo.create({
          title: ['My Dream Job', 'A Day at the Beach', 'My Favorite Food', 'Why I Love English'][si],
          category: ['Karya Tulis', 'Cerita', 'Puisi', 'Opini'][si],
          content: 'I wrote this story in English class. At first I was nervous, but my teacher said mistakes help us learn. Now I feel braver to speak and write in English every day!',
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

  console.log('\nSeed selesai. Password semua akun demo:', DEFAULT_PASSWORD);
  console.log('  Super admin : superadmin@mentalenglish.id');
  console.log('  Admin       : admin.pusat@mentalenglish.id   (login pilih cabang "Mental English Pusat")');
  console.log('  Pengajar    : teacher1.pusat@mentalenglish.id (login pilih cabang "Mental English Pusat")');
  console.log('  Orang tua   : ortu.aisyah@mentalenglish.id');
  console.log('  Pelajar     : aisyah@mentalenglish.id');
  await ds.destroy();
}

main().catch(async (e) => {
  console.error(e);
  await ds.destroy().catch(() => undefined);
  process.exit(1);
});
