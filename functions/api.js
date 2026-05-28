function json(data, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", "no-store");
  headers.set("access-control-allow-origin", "*");
  headers.set("access-control-allow-methods", "GET,POST,OPTIONS");
  headers.set("access-control-allow-headers", "content-type");
  return new Response(JSON.stringify(data), {
    status: init.status || 200,
    headers,
  });
}

function normalizeClassCode(value) {
  return String(value || "").trim().toUpperCase();
}

function isValidClassCode(code) {
  return /^(?:[1-6])[AB]$/.test(code);
}

async function ensureClasses(env) {
  const row = await env.DB.prepare("SELECT COUNT(*) AS total FROM classes").first();
  if ((row?.total || 0) === 0) {
    const statements = [
      ["1A", "Kelas 1A", 1],
      ["1B", "Kelas 1B", 2],
      ["2A", "Kelas 2A", 3],
      ["2B", "Kelas 2B", 4],
      ["3A", "Kelas 3A", 5],
      ["3B", "Kelas 3B", 6],
      ["4A", "Kelas 4A", 7],
      ["4B", "Kelas 4B", 8],
      ["5A", "Kelas 5A", 9],
      ["5B", "Kelas 5B", 10],
      ["6A", "Kelas 6A", 11],
      ["6B", "Kelas 6B", 12],
    ].map(([code, name, sortOrder]) => env.DB.prepare(
      "INSERT INTO classes (code, name, sort_order) VALUES (?, ?, ?)"
    ).bind(code, name, sortOrder));
    await env.DB.batch(statements);
  }
}

function badRequest(message) {
  return json({ ok: false, error: message }, { status: 400 });
}

function notFound(message = "Route tidak ditemukan") {
  return json({ ok: false, error: message }, { status: 404 });
}

async function getClasses(env) {
  const result = await env.DB.prepare(
    "SELECT code, name, sort_order AS sortOrder FROM classes ORDER BY sort_order, code"
  ).all();
  return result.results || [];
}

async function getStudents(env, classCode, includeInactive = false) {
  const sql = includeInactive
    ? `SELECT id, class_code AS classCode, student_order AS studentOrder, nisn, name, active
       FROM students
       WHERE class_code = ?
       ORDER BY student_order, id`
    : `SELECT id, class_code AS classCode, student_order AS studentOrder, nisn, name, active
       FROM students
       WHERE class_code = ? AND active = 1
       ORDER BY student_order, id`;
  const result = await env.DB.prepare(sql).bind(classCode).all();
  return result.results || [];
}

async function getAttendance(env, classCode, date) {
  const result = await env.DB.prepare(
    `SELECT student_id AS studentId, status, note
     FROM attendance
     WHERE class_code = ? AND date = ?`
  ).bind(classCode, date).all();
  return result.results || [];
}

async function clearAttendance(env, classCode, date) {
  const result = await env.DB.prepare(
    "DELETE FROM attendance WHERE class_code = ? AND date = ?"
  ).bind(classCode, date).run();
  return result.meta?.changes || 0;
}

async function upsertAttendance(env, classCode, date, records, replace = false) {
  if (!Array.isArray(records)) return 0;
  const statements = [];
  if (replace) {
    statements.push(
      env.DB.prepare("DELETE FROM attendance WHERE class_code = ? AND date = ?").bind(classCode, date)
    );
  }

  for (const row of records) {
    const studentId = Number(row?.studentId);
    const status = String(row?.status || "").trim().toUpperCase();
    const note = String(row?.note || "").trim();
    if (!studentId || !["H", "S", "I", "A"].includes(status)) continue;
    statements.push(
      env.DB.prepare(
        `INSERT INTO attendance (date, class_code, student_id, status, note, updated_at)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
      ).bind(date, classCode, studentId, status, note)
    );
  }

  if (statements.length > 0) {
    await env.DB.batch(statements);
  }
  return statements.length;
}

async function saveRoster(env, classCode, students) {
  if (!Array.isArray(students)) return 0;
  const statements = [];
  const normalized = students
    .map((row) => ({
      id: row?.id ? Number(row.id) : null,
      nisn: String(row?.nisn || "").trim(),
      name: String(row?.name || "").trim(),
      active: row?.active === false || row?.active === 0 || row?.active === "0" ? 0 : 1,
    }))
    .filter(row => row.name.length > 0 || row.id);

  normalized.forEach((row, index) => {
    const studentOrder = index + 1;
    if (row.id) {
      statements.push(
        env.DB.prepare(
          `UPDATE students
           SET nisn = ?, name = ?, student_order = ?, active = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ? AND class_code = ?`
        ).bind(row.nisn, row.name, studentOrder, row.active, row.id, classCode)
      );
    } else if (row.name) {
      statements.push(
        env.DB.prepare(
          `INSERT INTO students (class_code, student_order, nisn, name, active)
           VALUES (?, ?, ?, ?, ?)`
        ).bind(classCode, studentOrder, row.nisn, row.name, row.active)
      );
    }
  });

  if (statements.length > 0) {
    await env.DB.batch(statements);
  }
  return statements.length;
}

async function resequenceClassStudents(env, classCode) {
  const rows = await env.DB.prepare(
    `SELECT id
     FROM students
     WHERE class_code = ?
     ORDER BY student_order, id`
  ).bind(classCode).all();

  const statements = (rows.results || []).map((row, index) =>
    env.DB.prepare(
      `UPDATE students
       SET student_order = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND class_code = ?`
    ).bind(index + 1, row.id, classCode)
  );

  if (statements.length > 0) {
    await env.DB.batch(statements);
  }
}

async function moveRoster(env, fromClassCode, toClassCode) {
  if (fromClassCode === toClassCode) return 0;

  const source = await env.DB.prepare(
    `SELECT id, student_order AS studentOrder
     FROM students
     WHERE class_code = ? AND active = 1
     ORDER BY student_order, id`
  ).bind(fromClassCode).all();

  const rows = source.results || [];
  if (rows.length === 0) return 0;

  const maxTargetOrderRow = await env.DB.prepare(
    `SELECT COALESCE(MAX(student_order), 0) AS maxOrder
     FROM students
     WHERE class_code = ?`
  ).bind(toClassCode).first();
  let nextOrder = Number(maxTargetOrderRow?.maxOrder || 0) + 1;

  const statements = rows.map((row) =>
    env.DB.prepare(
      `UPDATE students
       SET class_code = ?, student_order = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND class_code = ?`
    ).bind(toClassCode, nextOrder++, row.id, fromClassCode)
  );

  await env.DB.batch(statements);
  await resequenceClassStudents(env, fromClassCode);
  return rows.length;
}

async function deleteClassRoster(env, classCode) {
  const statements = [
    env.DB.prepare("DELETE FROM attendance WHERE class_code = ?").bind(classCode),
    env.DB.prepare("DELETE FROM students WHERE class_code = ?").bind(classCode),
  ];
  await env.DB.batch(statements);
  return true;
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET,POST,OPTIONS",
        "access-control-allow-headers": "content-type",
        "access-control-max-age": "86400",
      }
    });
  }

  try {
    await ensureClasses(env);

    const action = url.searchParams.get("action") || "classes";
    const method = request.method.toUpperCase();

    if (method === "GET") {
      if (action === "classes") {
        return json({ ok: true, classes: await getClasses(env) });
      }

      if (action === "students") {
        const classCode = normalizeClassCode(url.searchParams.get("classCode"));
        const includeInactive = String(url.searchParams.get("includeInactive") || "") === "1";
        if (!isValidClassCode(classCode)) return badRequest("Kode kelas tidak valid.");
        return json({ ok: true, students: await getStudents(env, classCode, includeInactive) });
      }

      if (action === "attendance") {
        const classCode = normalizeClassCode(url.searchParams.get("classCode"));
        const date = String(url.searchParams.get("date") || "").trim();
        if (!isValidClassCode(classCode)) return badRequest("Kode kelas tidak valid.");
        if (!date) return badRequest("Tanggal wajib diisi.");
        return json({ ok: true, records: await getAttendance(env, classCode, date) });
      }

      return notFound();
    }

    if (method === "POST") {
      const payload = await request.json().catch(() => ({}));
      const actionPost = String(payload?.action || action || "").trim();

      if (actionPost === "saveAttendance") {
        const classCode = normalizeClassCode(payload.classCode);
        const date = String(payload.date || "").trim();
        if (!isValidClassCode(classCode)) return badRequest("Kode kelas tidak valid.");
        if (!date) return badRequest("Tanggal wajib diisi.");
        const saved = await upsertAttendance(env, classCode, date, payload.records || [], Boolean(payload.replace));
        return json({ ok: true, saved });
      }

      if (actionPost === "saveRoster") {
        const classCode = normalizeClassCode(payload.classCode);
        if (!isValidClassCode(classCode)) return badRequest("Kode kelas tidak valid.");
        const saved = await saveRoster(env, classCode, payload.students || []);
        return json({ ok: true, saved });
      }

      if (actionPost === "copyRoster" || actionPost === "moveRoster") {
        const fromClassCode = normalizeClassCode(payload.fromClassCode);
        const toClassCode = normalizeClassCode(payload.toClassCode);
        if (!isValidClassCode(fromClassCode) || !isValidClassCode(toClassCode)) {
          return badRequest("Kode kelas sumber atau tujuan tidak valid.");
        }
        const moved = await moveRoster(env, fromClassCode, toClassCode);
        return json({ ok: true, moved });
      }

      if (actionPost === "clearAttendance") {
        const classCode = normalizeClassCode(payload.classCode);
        const date = String(payload.date || "").trim();
        if (!isValidClassCode(classCode)) return badRequest("Kode kelas tidak valid.");
        if (!date) return badRequest("Tanggal wajib diisi.");
        const cleared = await clearAttendance(env, classCode, date);
        return json({ ok: true, cleared });
      }

      if (actionPost === "deleteClassRoster") {
        const classCode = normalizeClassCode(payload.classCode);
        if (!isValidClassCode(classCode)) return badRequest("Kode kelas tidak valid.");
        await deleteClassRoster(env, classCode);
        return json({ ok: true });
      }

      return notFound();
    }

    return notFound();
  } catch (error) {
    return json({
      ok: false,
      error: error?.message || "Terjadi kesalahan server",
    }, { status: 500 });
  }
}
