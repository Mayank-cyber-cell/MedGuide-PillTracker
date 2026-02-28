import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const db = new Database("medguide.db");
const JWT_SECRET = process.env.JWT_SECRET || "medguide-secret-key-123";

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    emergency_contact_name TEXT,
    emergency_contact_email TEXT,
    emergency_contact_phone TEXT
  );

  CREATE TABLE IF NOT EXISTS medications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    dosage TEXT NOT NULL,
    frequency TEXT NOT NULL,
    reminder_time TEXT NOT NULL,
    days_of_week TEXT, -- Comma separated indices "0,1,2,3,4,5,6"
    start_date TEXT NOT NULL,
    end_date TEXT,
    risk_level TEXT,
    side_effects TEXT,
    total_reports INTEGER,
    serious_cases INTEGER,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );

  CREATE TABLE IF NOT EXISTS adherence (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    medication_id INTEGER NOT NULL,
    status TEXT NOT NULL, -- 'taken', 'skipped', 'missed'
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (medication_id) REFERENCES medications (id)
  );
`);

async function startServer() {
  const app = express();
  app.use(express.json());

  // Middleware to verify JWT
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  // Auth Routes
  app.post("/api/register", async (req, res) => {
    const { name, email, password } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const stmt = db.prepare("INSERT INTO users (name, email, password) VALUES (?, ?, ?)");
      const result = stmt.run(name, email, hashedPassword);
      res.status(201).json({ id: result.lastInsertRowid });
    } catch (error: any) {
      if (error.message.includes("UNIQUE")) {
        res.status(400).json({ error: "Email already exists" });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });

  app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  });

  // User Profile / Emergency Contact
  app.get("/api/user", authenticateToken, (req: any, res) => {
    const user = db.prepare("SELECT id, name, email, emergency_contact_name, emergency_contact_email, emergency_contact_phone FROM users WHERE id = ?").get(req.user.id);
    res.json(user);
  });

  app.post("/api/emergency-contact", authenticateToken, (req: any, res) => {
    const { name, email, phone } = req.body;
    db.prepare("UPDATE users SET emergency_contact_name = ?, emergency_contact_email = ?, emergency_contact_phone = ? WHERE id = ?")
      .run(name, email, phone, req.user.id);
    res.json({ success: true });
  });

  // OpenFDA Proxy
  app.get("/api/drug-safety/:name", authenticateToken, async (req, res) => {
    const drugName = req.params.name;
    const apiKey = process.env.OPENFDA_API_KEY;
    const apiKeyParam = apiKey ? `&api_key=${apiKey}` : "";

    try {
      const response = await fetch(`https://api.fda.gov/drug/event.json?search=patient.drug.medicinalproduct:"${drugName}"&limit=1${apiKeyParam}`);
      if (!response.ok) return res.status(404).json({ error: "Not found" });
      const data = await response.json();
      
      const seriousResponse = await fetch(`https://api.fda.gov/drug/event.json?search=patient.drug.medicinalproduct:"${drugName}"+AND+serious:1&limit=1${apiKeyParam}`);
      let seriousCases = 0;
      if (seriousResponse.ok) {
        const seriousData = await seriousResponse.json();
        seriousCases = seriousData.meta.results.total;
      }

      res.json({ ...data, seriousCases });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch from OpenFDA" });
    }
  });

  // Medication Routes
  app.get("/api/medicines", authenticateToken, (req: any, res) => {
    const medicines = db.prepare("SELECT * FROM medications WHERE user_id = ?").all(req.user.id);
    res.json(medicines);
  });

  app.post("/api/medicines", authenticateToken, (req: any, res) => {
    const { name, dosage, frequency, reminder_time, days_of_week, start_date, end_date, risk_level, side_effects, total_reports, serious_cases } = req.body;
    const stmt = db.prepare(`
      INSERT INTO medications (user_id, name, dosage, frequency, reminder_time, days_of_week, start_date, end_date, risk_level, side_effects, total_reports, serious_cases)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(req.user.id, name, dosage, frequency, reminder_time, days_of_week, start_date, end_date, risk_level, side_effects, total_reports, serious_cases);
    res.status(201).json({ id: result.lastInsertRowid });
  });

  app.delete("/api/medicines/:id", authenticateToken, (req: any, res) => {
    db.prepare("DELETE FROM medications WHERE id = ? AND user_id = ?").run(req.params.id, req.user.id);
    res.json({ success: true });
  });

  // Adherence Routes
  app.get("/api/adherence", authenticateToken, (req: any, res) => {
    const adherence = db.prepare(`
      SELECT a.*, m.name as medicine_name 
      FROM adherence a 
      JOIN medications m ON a.medication_id = m.id 
      WHERE m.user_id = ?
      ORDER BY a.timestamp DESC
    `).all(req.user.id);
    res.json(adherence);
  });

  app.post("/api/adherence", authenticateToken, (req: any, res) => {
    const { medication_id, status } = req.body;
    
    // Verify ownership
    const med = db.prepare("SELECT * FROM medications WHERE id = ? AND user_id = ?").get(medication_id, req.user.id);
    if (!med) return res.status(403).json({ error: "Forbidden" });

    db.prepare("INSERT INTO adherence (medication_id, status) VALUES (?, ?)").run(medication_id, status);

    // Adherence Logic Check
    if (status === 'missed') {
      checkEmergencyEscalation(req.user.id);
    }

    res.status(201).json({ success: true });
  });

  // Emergency Escalation Logic
  function checkEmergencyEscalation(userId: number) {
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as any;
    if (!user.emergency_contact_email) return;

    // Check 3 consecutive missed
    const recentAdherence = db.prepare(`
      SELECT status FROM adherence a
      JOIN medications m ON a.medication_id = m.id
      WHERE m.user_id = ?
      ORDER BY a.timestamp DESC LIMIT 3
    `).all(userId) as any[];

    const consecutiveMissed = recentAdherence.length === 3 && recentAdherence.every(a => a.status === 'missed');

    // Check 5 missed in 7 days
    const weeklyMissed = db.prepare(`
      SELECT COUNT(*) as count FROM adherence a
      JOIN medications m ON a.medication_id = m.id
      WHERE m.user_id = ? AND a.status = 'missed' AND a.timestamp > datetime('now', '-7 days')
    `).get(userId) as any;

    if (consecutiveMissed || weeklyMissed.count >= 5) {
      sendEmergencyAlert(user);
    }
  }

  function sendEmergencyAlert(user: any) {
    console.log(`🚨 EMERGENCY ALERT for ${user.name}`);
    console.log(`To: ${user.emergency_contact_email}`);
    console.log(`Subject: Medication Alert – Immediate Attention Needed`);
    console.log(`Message: ${user.name} has missed their prescribed medication multiple times. Please check on them.`);
    // In a real app, use nodemailer or an SMS API here.
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
