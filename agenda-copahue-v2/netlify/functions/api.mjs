// API de la Agenda Coordinación Operativa · Hotel Copahue
// Netlify Function (v2) + Netlify Blobs. No requiere configuración ni cuentas externas.
//
// Rutas (todas bajo /api):
//   GET    /api/ping
//   POST   /api/register      { name, password }  -> { token, user }
//   POST   /api/login         { name, password }  -> { token, user }
//   POST   /api/password      { current, next }   -> { ok }
//   GET    /api/users                             -> [{ id, name }]
//   GET    /api/data                              -> { doc, rev }
//   PUT    /api/data          { doc, baseRev }    -> { rev }   (409 si otro dispositivo guardó antes)
//   GET    /api/shared                            -> [items compartidos conmigo o por mí]
//   PUT    /api/shared/:id    item                -> { ok }
//   DELETE /api/shared/:id                        -> { ok }

import crypto from "node:crypto";
import { getStore } from "@netlify/blobs";

export const config = { path: "/api/*" };

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

const b64u = (buf) => Buffer.from(buf).toString("base64url");

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(String(password), salt, 120000, 32, "sha256").toString("hex");
}

function normName(name) {
  return String(name || "").trim().replace(/\s+/g, " ");
}

export function createHandler(getStoreFn) {
  // Se obtiene el store en cada request (el contexto de Blobs lo inyecta Netlify por invocación)
  const store = () => Promise.resolve(getStoreFn());

  async function getSecret(s) {
    let secret = await s.get("meta/secret", { type: "text" });
    if (!secret) {
      secret = crypto.randomBytes(32).toString("hex");
      await s.set("meta/secret", secret);
    }
    return secret;
  }

  async function makeToken(s, uid) {
    const secret = await getSecret(s);
    const payload = b64u(JSON.stringify({ uid, iat: Date.now() }));
    const sig = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
    return `${payload}.${sig}`;
  }

  async function readToken(s, req) {
    const auth = req.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    const [payload, sig] = token.split(".");
    if (!payload || !sig) return null;
    const secret = await getSecret(s);
    const expected = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    try {
      const { uid } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
      const users = (await s.get("meta/users", { type: "json" })) || [];
      const u = users.find((x) => x.id === uid);
      return u ? { id: u.id, name: u.name } : null;
    } catch {
      return null;
    }
  }

  return async function handler(req) {
    try {
      const s = await store();
      const url = new URL(req.url);
      const parts = url.pathname.replace(/^\/(\.netlify\/functions\/api|api)\/?/, "").split("/").filter(Boolean);
      const route = parts[0] || "";
      const method = req.method.toUpperCase();
      const body = async () => {
        try {
          return await req.json();
        } catch {
          return {};
        }
      };

      if (route === "ping") return json(200, { ok: true, service: "agenda-copahue", v: 2 });

      if (route === "register" && method === "POST") {
        const { name, password } = await body();
        const clean = normName(name);
        if (clean.length < 2 || clean.length > 40) return json(400, { error: "El nombre debe tener entre 2 y 40 caracteres." });
        if (!password || String(password).length < 4) return json(400, { error: "La clave debe tener al menos 4 caracteres." });
        const users = (await s.get("meta/users", { type: "json" })) || [];
        if (users.some((u) => u.name.toLowerCase() === clean.toLowerCase()))
          return json(409, { error: "Ya existe un usuario con ese nombre." });
        const salt = crypto.randomBytes(16).toString("hex");
        const user = { id: crypto.randomUUID(), name: clean, salt, hash: hashPassword(password, salt), createdAt: Date.now() };
        users.push(user);
        await s.setJSON("meta/users", users);
        return json(200, { token: await makeToken(s, user.id), user: { id: user.id, name: user.name } });
      }

      if (route === "login" && method === "POST") {
        const { name, password } = await body();
        const clean = normName(name).toLowerCase();
        const users = (await s.get("meta/users", { type: "json" })) || [];
        const u = users.find((x) => x.name.toLowerCase() === clean);
        if (!u || hashPassword(password || "", u.salt) !== u.hash) return json(401, { error: "Usuario o clave incorrectos." });
        return json(200, { token: await makeToken(s, u.id), user: { id: u.id, name: u.name } });
      }

      const me = await readToken(s, req);
      if (!me) return json(401, { error: "Sesión vencida. Volvé a ingresar." });

      if (route === "me") return json(200, { user: me });

      if (route === "password" && method === "POST") {
        const { current, next } = await body();
        if (!next || String(next).length < 4) return json(400, { error: "La clave nueva debe tener al menos 4 caracteres." });
        const users = (await s.get("meta/users", { type: "json" })) || [];
        const u = users.find((x) => x.id === me.id);
        if (!u || hashPassword(current || "", u.salt) !== u.hash) return json(403, { error: "La clave actual no es correcta." });
        u.salt = crypto.randomBytes(16).toString("hex");
        u.hash = hashPassword(next, u.salt);
        u.passwordChangedAt = Date.now();
        await s.setJSON("meta/users", users);
        return json(200, { ok: true });
      }

      if (route === "users" && method === "GET") {
        const users = (await s.get("meta/users", { type: "json" })) || [];
        return json(200, users.map((u) => ({ id: u.id, name: u.name })));
      }

      if (route === "data") {
        const key = `data/${me.id}`;
        if (method === "GET") {
          const rec = (await s.get(key, { type: "json" })) || { doc: null, rev: 0 };
          return json(200, rec);
        }
        if (method === "PUT") {
          const { doc, baseRev } = await body();
          if (!doc || typeof doc !== "object") return json(400, { error: "Datos inválidos." });
          const cur = (await s.get(key, { type: "json" })) || { doc: null, rev: 0 };
          if (typeof baseRev === "number" && baseRev !== cur.rev) return json(409, { error: "conflict", doc: cur.doc, rev: cur.rev });
          const rev = (cur.rev || 0) + 1;
          await s.setJSON(key, { doc, rev, savedAt: Date.now() });
          return json(200, { rev });
        }
      }

      if (route === "shared") {
        const id = parts[1];
        if (!id && method === "GET") {
          const { blobs } = await s.list({ prefix: "shared/" });
          const items = await Promise.all(blobs.map((b) => s.get(b.key, { type: "json" }).catch(() => null)));
          const limit = new Date(Date.now() - 120 * 86400000).toISOString().slice(0, 10);
          const out = [];
          for (let i = 0; i < items.length; i++) {
            const it = items[i];
            if (!it) continue;
            // Limpieza: eventos únicos con más de 120 días de antigüedad
            if (it.kind === "single" && it.date && it.date < limit) {
              s.delete(blobs[i].key).catch(() => {});
              continue;
            }
            if (it.ownerId === me.id || (it.recipients || []).includes(me.id)) out.push(it);
          }
          return json(200, out);
        }
        if (id && !/^[A-Za-z0-9_-]{4,80}$/.test(id)) return json(400, { error: "id inválido" });
        if (id && method === "PUT") {
          const item = await body();
          const key = `shared/${id}`;
          const cur = await s.get(key, { type: "json" });
          if (cur && cur.ownerId !== me.id) return json(403, { error: "Solo quien lo creó puede modificarlo." });
          const clean = { ...item, id, ownerId: me.id, ownerName: me.name, updatedAt: Date.now() };
          await s.setJSON(key, clean);
          return json(200, { ok: true });
        }
        if (id && method === "DELETE") {
          const key = `shared/${id}`;
          const cur = await s.get(key, { type: "json" });
          if (cur && cur.ownerId !== me.id) return json(403, { error: "Solo quien lo creó puede eliminarlo." });
          await s.delete(key);
          return json(200, { ok: true });
        }
      }

      return json(404, { error: "Ruta no encontrada" });
    } catch (e) {
      return json(500, { error: "Error del servidor", detail: String(e && e.message ? e.message : e) });
    }
  };
}

export default createHandler(() => getStore({ name: "agenda-copahue", consistency: "strong" }));
