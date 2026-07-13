import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(
  'app.get("/api/health", (req, res) => {',
  `app.get("/api/audit-logs-test", async (req, res) => {
    try {
      if (!admin.apps.length) return res.status(500).json({ error: "No admin app" });
      const db = admin.firestore();
      const snap = await db.collection("audit_logs").get();
      res.json({ count: snap.size, docs: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.get("/api/health", (req, res) => {`
);
fs.writeFileSync('server.ts', code);
