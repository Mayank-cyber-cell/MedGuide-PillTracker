import express from "express";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const JWT_SECRET = process.env.JWT_SECRET || "medguide-secret-key-123";

async function startServer() {
  const app = express();
  app.use(express.json());

  // CORS middleware for production
  app.use((req, res, next) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',')
      : ['*'];

    const origin = req.headers.origin;
    if (allowedOrigins.includes('*') || (origin && allowedOrigins.includes(origin))) {
      res.header('Access-Control-Allow-Origin', origin || '*');
    }

    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: supabaseUrl ? 'connected' : 'not configured'
    });
  });

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
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (existingUser) {
        return res.status(400).json({ error: "Email already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const { data, error } = await supabase
        .from('users')
        .insert([{ name, email, password: hashedPassword }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      res.status(201).json({ id: data.id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;

    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (error || !user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET);
      res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // User Profile / Emergency Contact
  app.get("/api/user", authenticateToken, async (req: any, res) => {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('id, name, email, emergency_contact_name, emergency_contact_email, emergency_contact_phone')
        .eq('id', req.user.id)
        .single();

      if (error) throw error;
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/emergency-contact", authenticateToken, async (req: any, res) => {
    const { name, email, phone } = req.body;
    try {
      const { error } = await supabase
        .from('users')
        .update({
          emergency_contact_name: name,
          emergency_contact_email: email,
          emergency_contact_phone: phone
        })
        .eq('id', req.user.id);

      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
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
  app.get("/api/medicines", authenticateToken, async (req: any, res) => {
    try {
      const { data: medicines, error } = await supabase
        .from('medications')
        .select('*')
        .eq('user_id', req.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      res.json(medicines);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/medicines", authenticateToken, async (req: any, res) => {
    const { name, dosage, frequency, reminder_time, days_of_week, start_date, end_date, risk_level, side_effects, total_reports, serious_cases } = req.body;
    try {
      const { data, error } = await supabase
        .from('medications')
        .insert([{
          user_id: req.user.id,
          name,
          dosage,
          frequency,
          reminder_time,
          days_of_week,
          start_date,
          end_date,
          risk_level,
          side_effects,
          total_reports,
          serious_cases
        }])
        .select()
        .single();

      if (error) throw error;
      res.status(201).json({ id: data.id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/medicines/:id", authenticateToken, async (req: any, res) => {
    try {
      const { error } = await supabase
        .from('medications')
        .delete()
        .eq('id', req.params.id)
        .eq('user_id', req.user.id);

      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Adherence Routes
  app.get("/api/adherence", authenticateToken, async (req: any, res) => {
    try {
      const { data: adherence, error } = await supabase
        .from('adherence')
        .select(`
          *,
          medications!inner(name, user_id)
        `)
        .eq('medications.user_id', req.user.id)
        .order('timestamp', { ascending: false });

      if (error) throw error;

      const formattedData = adherence.map((a: any) => ({
        ...a,
        medicine_name: a.medications.name
      }));

      res.json(formattedData);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/adherence", authenticateToken, async (req: any, res) => {
    const { medication_id, status } = req.body;

    try {
      // Verify ownership
      const { data: med, error: medError } = await supabase
        .from('medications')
        .select('*')
        .eq('id', medication_id)
        .eq('user_id', req.user.id)
        .maybeSingle();

      if (medError || !med) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const { error } = await supabase
        .from('adherence')
        .insert([{ medication_id, status }]);

      if (error) throw error;

      // Adherence Logic Check
      if (status === 'missed') {
        await checkEmergencyEscalation(req.user.id);
      }

      res.status(201).json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Emergency Escalation Logic
  async function checkEmergencyEscalation(userId: string) {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (!user?.emergency_contact_email) return;

      // Check 3 consecutive missed
      const { data: recentAdherence } = await supabase
        .from('adherence')
        .select(`
          status,
          medications!inner(user_id)
        `)
        .eq('medications.user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(3);

      const consecutiveMissed = recentAdherence && recentAdherence.length === 3 &&
        recentAdherence.every((a: any) => a.status === 'missed');

      // Check 5 missed in 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: weeklyMissed } = await supabase
        .from('adherence')
        .select(`
          id,
          medications!inner(user_id)
        `, { count: 'exact' })
        .eq('medications.user_id', userId)
        .eq('status', 'missed')
        .gte('timestamp', sevenDaysAgo.toISOString());

      if (consecutiveMissed || (weeklyMissed && weeklyMissed.length >= 5)) {
        sendEmergencyAlert(user);
      }
    } catch (error) {
      console.error('Error checking emergency escalation:', error);
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
