
const STATUS = [
  { k: "H", l: "Hadir", c: "H" },
  { k: "S", l: "Sakit", c: "S" },
  { k: "I", l: "Izin", c: "I" },
  { k: "A", l: "Alpha", c: "A" },
];

const DEFAULT_CLASS_CODE = "1A";
const CLASS_ORDER = ["1A","1B","2A","2B","3A","3B","4A","4B","5A","5B","6A","6B"];

const el = (s) => document.querySelector(s);
const state = {
  classes: [],
  classCode: localStorage.getItem("absensi-class-code") || DEFAULT_CLASS_CODE,
  date: new Date(),
  students: [],
  attendance: {},
  rosterRows: [],
  loading: false,
};

function todayIso(d = new Date()) {
  return d.toISOString().slice(0,10);
}
function startWeek(d) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day);
  x.setHours(0,0,0,0);
  return x;
}
function prettyDate(d) {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(d);
}
function prettyShort(d) {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    day: "2-digit",
    month: "short"
  }).format(d);
}
function classLabel(code) {
  const found = state.classes.find(x => x.code === code);
  return found ? found.name : `Kelas ${code}`;
}
function setToast(message) {
  const t = el("#toast");
  t.textContent = message;
  t.style.display = "block";
  clearTimeout(setToast.timer);
  setToast.timer = setTimeout(() => t.style.display = "none", 1800);
}
function setLoading(isLoading, label = "Menyimpan") {
  state.loading = isLoading;
  const btn = el("#exportBtn");
  if (!btn) return;
  btn.disabled = isLoading;
}

async function apiGet(params = {}) {
  const url = new URL("/api", location.href);
  Object.entries(params).forEach(([k,v]) => {
    if (v !== undefined && v !== null && String(v).length > 0) url.searchParams.set(k, v);
  });
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok || data.ok === false) throw new Error(data.error || "Gagal memuat data");
  return data;
}
async function apiPost(action, body = {}) {
  const res = await fetch("/api", {
    method: "POST",
    headers: {"content-type":"application/json"},
    body: JSON.stringify({ action, ...body }),
  });
  const data = await res.json();
  if (!res.ok || data.ok === false) throw new Error(data.error || "Gagal menyimpan data");
  return data;
}

function buildClassOptions(selectEl, current) {
  selectEl.innerHTML = state.classes.map(item => `
    <option value="${item.code}" ${item.code === current ? "selected" : ""}>${item.name}</option>
  `).join("");
}
function syncClassSelectors() {
  buildClassOptions(el("#classSelect"), state.classCode);
  buildClassOptions(el("#rosterClassSelect"), state.classCode);
  buildClassOptions(el("#copyTargetSelect"), state.classes.find(c => c.code !== state.classCode)?.code || "");
  el("#copyTargetSelect").innerHTML = state.classes.map(item => `
    <option value="${item.code}" ${item.code !== state.classCode && item.code === (state.classes.find(c => c.code !== state.classCode)?.code || "") ? "selected" : ""}>
      ${item.name}
    </option>
  `).join("");
}

async function loadClasses() {
  const data = await apiGet({ action: "classes" });
  state.classes = data.classes || [];
  if (!state.classes.some(c => c.code === state.classCode)) {
    state.classCode = state.classes[0]?.code || DEFAULT_CLASS_CODE;
  }
  syncClassSelectors();
  el("#classCount").textContent = `${state.classes.length} kelas`;
  el("#classSelect").value = state.classCode;
  el("#rosterClassSelect").value = state.classCode;
  el("#copyTargetSelect").value = state.classes.find(c => c.code !== state.classCode)?.code || state.classCode;
}

async function loadClassData() {
  const classCode = state.classCode;
  const date = el("#dateInput").value;
  const [students, attendance] = await Promise.all([
    apiGet({ action: "students", classCode }),
    apiGet({ action: "attendance", classCode, date }),
  ]);
  state.students = students.students || [];
  state.attendance = {};
  (attendance.records || []).forEach(row => {
    state.attendance[String(row.studentId)] = { status: row.status, note: row.note || "" };
  });
  el("#studentCount").textContent = `${state.students.length} siswa aktif`;
  render();
}

function currentAttendanceCounts() {
  const counts = { H:0, S:0, I:0, A:0 };
  state.students.forEach(student => {
    const rec = state.attendance[String(student.id)];
    if (rec && counts[rec.status] !== undefined) counts[rec.status]++;
  });
  return counts;
}

function renderTop() {
  const dateValue = el("#dateInput").value;
  const dateObj = new Date(dateValue + "T00:00:00");
  el("#dateText").innerHTML = `<span>📅</span><span>${prettyDate(dateObj)}</span>`;
  const wk = startWeek(dateObj);
  el("#week").innerHTML = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(wk);
    d.setDate(d.getDate() + i);
    const active = todayIso(d) === dateValue ? "active" : "";
    return `<button class="day ${active}" data-date="${todayIso(d)}"><div>${prettyShort(d).split(",")[0]}</div><div class="n">${d.getDate()}</div></button>`;
  }).join("");
  el("#week").querySelectorAll("[data-date]").forEach(btn => {
    btn.addEventListener("click", () => {
      el("#dateInput").value = btn.dataset.date;
      loadClassData().catch(showError);
    });
  });
  const counts = currentAttendanceCounts();
  el("#stats").innerHTML = STATUS.map(s => `
    <div class="stat s-${s.c}">
      <div class="num">${counts[s.k] || 0}</div>
      <div class="lab">${s.l}</div>
    </div>
  `).join("");
}

function renderList() {
  const q = el("#q").value.trim().toLowerCase();
  const list = state.students.filter(student => {
    const label = `${student.name || ""} ${student.nisn || ""}`.toLowerCase();
    return !q || label.includes(q);
  });
  const rec = state.attendance;
  el("#list").innerHTML = list.length ? list.map(student => {
    const current = rec[String(student.id)]?.status || "";
    return `
      <div class="student">
        <div class="head">
          <div>
            <div class="nisn">NISN ${student.nisn || "-"}</div>
            <div class="name">${student.name}</div>
          </div>
          <div class="badge">${current || "Belum"}</div>
        </div>
        <div class="choices">
          ${STATUS.map(st => `
            <button class="choice ${current === st.k ? "active " + st.c : ""}" data-id="${student.id}" data-st="${st.k}">
              ${st.l}
            </button>
          `).join("")}
        </div>
      </div>
    `;
  }).join("") : `<div class="empty">Belum ada siswa aktif di kelas ini. Buka <b>Kelola Siswa</b> untuk menambah atau menyalin roster.</div>`;

  el("#list").querySelectorAll(".choice").forEach(btn => {
    btn.addEventListener("click", () => {
      updateStatus(btn.dataset.id, btn.dataset.st);
    });
  });
}

function render() {
  renderTop();
  renderList();
  document.title = `${classLabel(state.classCode)} - Absensi SD YPU 2026`;
}

async function updateStatus(studentId, status) {
  const currentDate = el("#dateInput").value;
  const student = state.students.find(s => String(s.id) === String(studentId));
  if (!student) return;
  state.attendance[String(studentId)] = { status, note: "" };
  renderTop();
  renderList();
  try {
    await apiPost("saveAttendance", {
      classCode: state.classCode,
      date: currentDate,
      records: [{ studentId: Number(studentId), status }],
    });
    setToast(`Status ${student.name} disimpan`);
  } catch (error) {
    showError(error);
    await loadClassData();
  }
}

async function bulkSet(status) {
  const currentDate = el("#dateInput").value;
  const records = state.students.map(student => ({
    studentId: student.id,
    status
  }));
  state.students.forEach(student => {
    state.attendance[String(student.id)] = { status, note: "" };
  });
  renderTop();
  renderList();
  try {
    await apiPost("saveAttendance", {
      classCode: state.classCode,
      date: currentDate,
      records,
    });
    setToast(`Semua siswa di ${classLabel(state.classCode)} diubah ke ${status}`);
  } catch (error) {
    showError(error);
    await loadClassData();
  }
}

function openSheet() { el("#overlay").style.display = "flex"; }
function closeSheet() { el("#overlay").style.display = "none"; }
function openRoster() { el("#rosterOverlay").style.display = "flex"; loadRosterEditor().catch(showError); }
function closeRoster() { el("#rosterOverlay").style.display = "none"; }

function rosterRowTemplate(row = {}, idx = 0) {
  const id = row.id || "";
  const nisn = row.nisn || "";
  const name = row.name || "";
  const active = row.active !== false && row.active !== 0 && row.active !== "0";
  return `
    <div class="roster-row" data-row="${idx}" data-id="${id}">
      <div class="roster-row-grid">
        <input class="input" type="text" placeholder="Urut" value="${row.studentOrder ?? idx + 1}" data-field="studentOrder"/>
        <input class="input" type="text" placeholder="NISN" value="${escapeHtml(nisn)}" data-field="nisn"/>
        <input class="input" type="text" placeholder="Nama siswa" value="${escapeHtml(name)}" data-field="name"/>
        <label class="checkbox">
          <input type="checkbox" ${active ? "checked" : ""} data-field="active"/>
          Aktif
        </label>
      </div>
    </div>
  `;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function loadRosterEditor() {
  el("#rosterClassSelect").value = state.classCode;
  el("#copyTargetSelect").innerHTML = state.classes.map(item => `
    <option value="${item.code}" ${item.code === state.classCode ? "disabled" : ""}>${item.name}</option>
  `).join("");
  const target = state.classes.find(c => c.code !== state.classCode)?.code || state.classCode;
  el("#copyTargetSelect").value = target;

  const data = await apiGet({ action: "students", classCode: state.classCode });
  state.rosterRows = (data.students || []).map((row, idx) => ({
    id: row.id,
    nisn: row.nisn || "",
    name: row.name || "",
    active: row.active ? 1 : 0,
    studentOrder: row.studentOrder || idx + 1,
  }));
  renderRoster();
}

function renderRoster() {
  const list = state.rosterRows;
  el("#rosterHint").innerHTML = `Sedang mengedit <b>${classLabel(state.classCode)}</b>. ${list.length} baris terisi.`;
  el("#rosterList").innerHTML = list.length ? list.map((row, idx) => {
    return `
      <div class="roster-row" data-index="${idx}" data-id="${row.id || ""}">
        <div class="roster-row-grid">
          <input class="input" type="text" placeholder="Urut" value="${escapeHtml(row.studentOrder ?? idx + 1)}" data-field="studentOrder"/>
          <input class="input" type="text" placeholder="NISN" value="${escapeHtml(row.nisn)}" data-field="nisn"/>
          <input class="input" type="text" placeholder="Nama siswa" value="${escapeHtml(row.name)}" data-field="name"/>
          <label class="checkbox">
            <input type="checkbox" ${row.active ? "checked" : ""} data-field="active"/>
            Aktif
          </label>
        </div>
        <div class="inline-actions" style="margin-top:10px; justify-content:flex-end">
          <button class="btn secondary" data-action="duplicate">Duplikat</button>
          <button class="btn danger" data-action="remove">Nonaktifkan</button>
        </div>
      </div>
    `;
  }).join("") : `<div class="empty">Belum ada siswa di kelas ini. Klik <b>Tambah</b> untuk menambahkan siswa baru.</div>`;

  el("#rosterList").querySelectorAll(".roster-row").forEach(rowEl => {
    const index = Number(rowEl.dataset.index);
    rowEl.querySelectorAll("[data-field]").forEach(field => {
      field.addEventListener("input", () => {
        const row = state.rosterRows[index];
        if (!row) return;
        if (field.dataset.field === "studentOrder") row.studentOrder = Number(field.value || index + 1);
        if (field.dataset.field === "nisn") row.nisn = field.value;
        if (field.dataset.field === "name") row.name = field.value;
      });
      field.addEventListener("change", () => {
        const row = state.rosterRows[index];
        if (!row) return;
        if (field.dataset.field === "active") row.active = field.checked ? 1 : 0;
      });
    });
    rowEl.querySelectorAll("[data-action]").forEach(actionBtn => {
      actionBtn.addEventListener("click", () => {
        const action = actionBtn.dataset.action;
        if (action === "duplicate") {
          const current = state.rosterRows[index];
          state.rosterRows.splice(index + 1, 0, {
            id: null,
            nisn: current.nisn,
            name: current.name,
            active: 1,
            studentOrder: (current.studentOrder || index + 1) + 1,
          });
          renumberRoster();
          renderRoster();
        }
        if (action === "remove") {
          state.rosterRows[index].active = 0;
          renderRoster();
        }
      });
    });
  });
}

function renumberRoster() {
  state.rosterRows.forEach((row, idx) => {
    if (!row.studentOrder || Number.isNaN(Number(row.studentOrder))) row.studentOrder = idx + 1;
  });
}

function collectRosterRows() {
  const rows = [];
  el("#rosterList").querySelectorAll(".roster-row").forEach((rowEl, idx) => {
    const data = {
      id: rowEl.dataset.id ? Number(rowEl.dataset.id) : null,
      nisn: rowEl.querySelector('[data-field="nisn"]').value.trim(),
      name: rowEl.querySelector('[data-field="name"]').value.trim(),
      active: rowEl.querySelector('[data-field="active"]').checked ? 1 : 0,
      studentOrder: Number(rowEl.querySelector('[data-field="studentOrder"]').value || idx + 1),
    };
    if (data.name || data.nisn || data.id) rows.push(data);
  });
  return rows;
}

async function saveRoster() {
  const rows = collectRosterRows();
  try {
    setToast("Menyimpan roster...");
    await apiPost("saveRoster", {
      classCode: state.classCode,
      students: rows,
    });
    setToast(`Roster ${classLabel(state.classCode)} tersimpan`);
    await loadClassData();
    await loadRosterEditor();
  } catch (error) {
    showError(error);
  }
}

async function copyRoster() {
  const toClassCode = el("#copyTargetSelect").value;
  if (!toClassCode || toClassCode === state.classCode) {
    setToast("Pilih kelas tujuan yang berbeda");
    return;
  }
  try {
    await apiPost("copyRoster", {
      fromClassCode: state.classCode,
      toClassCode,
    });
    setToast(`Roster disalin ke ${classLabel(toClassCode)}`);
    if (toClassCode === state.classCode) {
      await loadRosterEditor();
    }
  } catch (error) {
    showError(error);
  }
}

function exportCSV() {
  const date = el("#dateInput").value;
  const rec = state.attendance;
  let csv = `Kelas,${state.classCode}\nTanggal,${date}\nNo,NISN,Nama,Status\n`;
  state.students.forEach((s, i) => {
    const status = rec[String(s.id)]?.status || "";
    csv += `${i+1},"${String(s.nisn || "").replaceAll('"','""')}","${String(s.name || "").replaceAll('"','""')}",${status}\n`;
  });
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `absensi-${state.classCode}-${date}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

async function clearDay() {
  try {
    await apiPost("clearAttendance", {
      classCode: state.classCode,
      date: el("#dateInput").value,
    });
    state.students.forEach(student => {
      delete state.attendance[String(student.id)];
    });
    render();
    setToast("Absensi hari ini dihapus");
  } catch (error) {
    showError(error);
  }
}

function showError(error) {
  console.error(error);
  setToast(error.message || "Terjadi kesalahan");
}

async function init() {
  el("#dateInput").value = todayIso();
  try {
    await loadClasses();
    el("#classSelect").value = state.classCode;
    el("#rosterClassSelect").value = state.classCode;
    await loadClassData();
  } catch (error) {
    showError(error);
  }
}

el("#classSelect").addEventListener("change", async () => {
  state.classCode = el("#classSelect").value;
  localStorage.setItem("absensi-class-code", state.classCode);
  el("#rosterClassSelect").value = state.classCode;
  try {
    await loadClassData();
  } catch (error) {
    showError(error);
  }
});

el("#rosterClassSelect").addEventListener("change", async () => {
  state.classCode = el("#rosterClassSelect").value;
  localStorage.setItem("absensi-class-code", state.classCode);
  el("#classSelect").value = state.classCode;
  await loadClassData();
  await loadRosterEditor();
});

el("#copyTargetSelect").addEventListener("change", () => {});
el("#dateInput").addEventListener("change", () => loadClassData().catch(showError));
el("#prevDay").addEventListener("click", () => {
  const d = new Date(el("#dateInput").value + "T00:00:00");
  d.setDate(d.getDate() - 1);
  el("#dateInput").value = todayIso(d);
  loadClassData().catch(showError);
});
el("#nextDay").addEventListener("click", () => {
  const d = new Date(el("#dateInput").value + "T00:00:00");
  d.setDate(d.getDate() + 1);
  el("#dateInput").value = todayIso(d);
  loadClassData().catch(showError);
});
el("#q").addEventListener("input", renderList);
el("#openSheet").addEventListener("click", openSheet);
el("#openSheet2").addEventListener("click", openSheet);
el("#closeSheet").addEventListener("click", closeSheet);
el("#overlay").addEventListener("click", (e) => { if (e.target === el("#overlay")) closeSheet(); });
el("#allH").addEventListener("click", () => bulkSet("H").catch(showError));
el("#allS").addEventListener("click", () => bulkSet("S").catch(showError));
el("#allI").addEventListener("click", () => bulkSet("I").catch(showError));
el("#allA").addEventListener("click", () => bulkSet("A").catch(showError));
el("#clearDay").addEventListener("click", () => clearDay().catch(showError));
el("#exportBtn").addEventListener("click", exportCSV);
el("#exportBtn2").addEventListener("click", exportCSV);
el("#openRoster").addEventListener("click", openRoster);
el("#closeRoster").addEventListener("click", closeRoster);
el("#rosterOverlay").addEventListener("click", (e) => { if (e.target === el("#rosterOverlay")) closeRoster(); });
el("#addStudentBtn").addEventListener("click", () => {
  state.rosterRows.push({
    id: null,
    nisn: "",
    name: "",
    active: 1,
    studentOrder: state.rosterRows.length + 1,
  });
  renderRoster();
});
el("#saveRosterBtn").addEventListener("click", () => saveRoster().catch(showError));
el("#copyRosterBtn").addEventListener("click", () => copyRoster().catch(showError));

init();
