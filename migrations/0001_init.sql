CREATE TABLE IF NOT EXISTS classes (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_code TEXT NOT NULL,
  student_order INTEGER NOT NULL DEFAULT 1,
  nisn TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_code) REFERENCES classes(code) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS attendance (
  date TEXT NOT NULL,
  class_code TEXT NOT NULL,
  student_id INTEGER NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('H', 'S', 'I', 'A')),
  note TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (date, class_code, student_id),
  FOREIGN KEY (class_code) REFERENCES classes(code) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_students_class_active ON students(class_code, active, student_order);
CREATE INDEX IF NOT EXISTS idx_attendance_class_date ON attendance(class_code, date);

INSERT OR IGNORE INTO classes (code, name, sort_order) VALUES ('1A', 'Kelas 1A', 1);
INSERT OR IGNORE INTO classes (code, name, sort_order) VALUES ('1B', 'Kelas 1B', 2);
INSERT OR IGNORE INTO classes (code, name, sort_order) VALUES ('2A', 'Kelas 2A', 3);
INSERT OR IGNORE INTO classes (code, name, sort_order) VALUES ('2B', 'Kelas 2B', 4);
INSERT OR IGNORE INTO classes (code, name, sort_order) VALUES ('3A', 'Kelas 3A', 5);
INSERT OR IGNORE INTO classes (code, name, sort_order) VALUES ('3B', 'Kelas 3B', 6);
INSERT OR IGNORE INTO classes (code, name, sort_order) VALUES ('4A', 'Kelas 4A', 7);
INSERT OR IGNORE INTO classes (code, name, sort_order) VALUES ('4B', 'Kelas 4B', 8);
INSERT OR IGNORE INTO classes (code, name, sort_order) VALUES ('5A', 'Kelas 5A', 9);
INSERT OR IGNORE INTO classes (code, name, sort_order) VALUES ('5B', 'Kelas 5B', 10);
INSERT OR IGNORE INTO classes (code, name, sort_order) VALUES ('6A', 'Kelas 6A', 11);
INSERT OR IGNORE INTO classes (code, name, sort_order) VALUES ('6B', 'Kelas 6B', 12);

INSERT INTO students (class_code, student_order, nisn, name, active) VALUES ('1A', 1, '3136899923', 'REVAL RESTU MAULANA', 1);
INSERT INTO students (class_code, student_order, nisn, name, active) VALUES ('1A', 2, '0141104224', 'ASIFA FIRDYA AFIFATUL JANAH', 1);
INSERT INTO students (class_code, student_order, nisn, name, active) VALUES ('1A', 3, '3143211259', 'FITRY NUR AFIFAH SUHENDAR', 1);
INSERT INTO students (class_code, student_order, nisn, name, active) VALUES ('1A', 4, '3144298534', 'ADELIA SALSABILA', 1);
INSERT INTO students (class_code, student_order, nisn, name, active) VALUES ('1A', 5, '3137636509', 'IZZARA AYUMI VANKA HELINA', 1);
INSERT INTO students (class_code, student_order, nisn, name, active) VALUES ('1A', 6, '3147717622', 'AZKA QEISHA', 1);
INSERT INTO students (class_code, student_order, nisn, name, active) VALUES ('1A', 7, '3139788137', 'FATURAHMAN PUTRA', 1);
INSERT INTO students (class_code, student_order, nisn, name, active) VALUES ('1A', 8, '3148172365', 'RADIKA ARFA TRISYANA', 1);
INSERT INTO students (class_code, student_order, nisn, name, active) VALUES ('1A', 9, '3131194100', 'HAZARD ALWI MUHARRAM', 1);
INSERT INTO students (class_code, student_order, nisn, name, active) VALUES ('1A', 10, '3146969413', 'ALFIN KAHFI', 1);
INSERT INTO students (class_code, student_order, nisn, name, active) VALUES ('1A', 11, '3142275544', 'AQILLA PUTRI RINZANI', 1);
INSERT INTO students (class_code, student_order, nisn, name, active) VALUES ('1A', 12, '3149825899', 'MAISYARA FAJRA RACHMADI', 1);
INSERT INTO students (class_code, student_order, nisn, name, active) VALUES ('1A', 13, '0147964111', 'ARJUNA IBRAHIM PUTRA NUGRAHA', 1);
INSERT INTO students (class_code, student_order, nisn, name, active) VALUES ('1A', 14, '3147337649', 'MUJNAH SYAQILA ELKA PUTRI', 1);
INSERT INTO students (class_code, student_order, nisn, name, active) VALUES ('1A', 15, '0145917781', 'DWI NATALIE RAMADHANI', 1);
INSERT INTO students (class_code, student_order, nisn, name, active) VALUES ('1A', 16, '3130803014', 'MUHAMMAD AZMI SYAHPUTRA', 1);
INSERT INTO students (class_code, student_order, nisn, name, active) VALUES ('1A', 17, '3145844110', 'MASYAILA AZURIA', 1);
INSERT INTO students (class_code, student_order, nisn, name, active) VALUES ('1A', 18, '0133342873', 'FITRAH ZIDDNY ALLYIDRUS', 1);
INSERT INTO students (class_code, student_order, nisn, name, active) VALUES ('1A', 19, '3146701597', 'MUHAMMAD ADHI PUTRA', 1);
INSERT INTO students (class_code, student_order, nisn, name, active) VALUES ('1A', 20, '3137699357', 'KANDI DAVIN PRATAMA', 1);
INSERT INTO students (class_code, student_order, nisn, name, active) VALUES ('1A', 21, '3139204926', 'FAQIH AHSIN SAKHO', 1);
INSERT INTO students (class_code, student_order, nisn, name, active) VALUES ('1A', 22, '3133611795', 'WAHYU NURHIDAYAT', 1);
INSERT INTO students (class_code, student_order, nisn, name, active) VALUES ('1A', 23, '3139127607', 'KEYLA RAYENKA', 1);
INSERT INTO students (class_code, student_order, nisn, name, active) VALUES ('1A', 24, '3130654026', 'ANDHARA SHAFIRA EFFENDI', 1);
INSERT INTO students (class_code, student_order, nisn, name, active) VALUES ('1A', 25, '3149705876', 'NAYLA NAFISYA AZZAHRA', 1);
INSERT INTO students (class_code, student_order, nisn, name, active) VALUES ('1A', 26, '3146913483', 'MUHAMMAD JIBRAN WIJI ALAZZA', 1);
INSERT INTO students (class_code, student_order, nisn, name, active) VALUES ('1A', 27, '3133837480', 'KAKA RIDHO SOPIAN', 1);
INSERT INTO students (class_code, student_order, nisn, name, active) VALUES ('1A', 28, '3145939194', 'MEYLA NURHASANAH PUTRI HARYADI', 1);
INSERT INTO students (class_code, student_order, nisn, name, active) VALUES ('1A', 29, '3138651739', 'GALIH PERMANA PUTRA', 1);
INSERT INTO students (class_code, student_order, nisn, name, active) VALUES ('1A', 30, '0133227989', 'RIZKY MUHAMMAD FRASETYA', 1);
INSERT INTO students (class_code, student_order, nisn, name, active) VALUES ('1A', 31, '3130177704', 'MUHAMAD RAIHAN DAIPAH', 1);
INSERT INTO students (class_code, student_order, nisn, name, active) VALUES ('1A', 32, '3139250741', 'ALIYA DWI AYNI', 1);
INSERT INTO students (class_code, student_order, nisn, name, active) VALUES ('1A', 33, '3139394228', 'AZZAHRA AYNOV PUTRI', 1);
INSERT INTO students (class_code, student_order, nisn, name, active) VALUES ('1A', 34, '3142183002', 'AKMAL DANISH FIRDAUS', 1);
INSERT INTO students (class_code, student_order, nisn, name, active) VALUES ('1A', 35, '3146095421', 'NADYA ALUNA RIZKIA HADIANSYAH', 1);
INSERT INTO students (class_code, student_order, nisn, name, active) VALUES ('1A', 36, '3142045800', 'MEGA LISTIANI AULIA', 1);
INSERT INTO students (class_code, student_order, nisn, name, active) VALUES ('1A', 37, '0139289359', 'SYABILLA AZZAHRA', 1);
INSERT INTO students (class_code, student_order, nisn, name, active) VALUES ('1A', 38, '3144459416', 'FAHMI FEBRIANTO', 1);
INSERT INTO students (class_code, student_order, nisn, name, active) VALUES ('1A', 39, '3137391483', 'RR. MUTIARA AQILA ZAHRA KAMILA', 1);
INSERT INTO students (class_code, student_order, nisn, name, active) VALUES ('1A', 40, '3134633817', 'REY MAHESA PUTRA', 1);
INSERT INTO students (class_code, student_order, nisn, name, active) VALUES ('1A', 41, '0144974938', 'WANDA PUTRI PERMANA', 1);
INSERT INTO students (class_code, student_order, nisn, name, active) VALUES ('1A', 42, '0141532458', 'BILQIS ARWA PERMANA', 1);
INSERT INTO students (class_code, student_order, nisn, name, active) VALUES ('1A', 43, '3134094515', 'KEYSHA SHIFA AZ ZAHRA', 1);
INSERT INTO students (class_code, student_order, nisn, name, active) VALUES ('1A', 44, '3147659292', 'SHIREEN KINANTI AZZAHWA', 1);
INSERT INTO students (class_code, student_order, nisn, name, active) VALUES ('1A', 45, '3127773010', 'ALIF SYAHPUTRA', 1);
INSERT INTO students (class_code, student_order, nisn, name, active) VALUES ('1A', 46, '0137076881', 'NADINE KHAIRA NURFADILLAH', 1);
INSERT INTO students (class_code, student_order, nisn, name, active) VALUES ('1A', 47, '0141213971', 'WINDI PUTRI PERMANA', 1);
INSERT INTO students (class_code, student_order, nisn, name, active) VALUES ('1A', 48, '3133895297', 'KANAYA APRILLIA SOMANTRI', 1);
INSERT INTO students (class_code, student_order, nisn, name, active) VALUES ('1A', 49, '0149652943', 'ANISA CAHAYA PITRI', 1);
