import express from "express";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import path from "path";
import dotenv from "dotenv";
import net from "net";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

const supabase: any = isSupabaseConfigured ? createClient(supabaseUrl!, supabaseKey!) : null;

const JWT_SECRET = process.env.JWT_SECRET || "medguide-secret-key-123";

function findAvailablePort(startPort: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();

    server.once("error", (error: any) => {
      if (error?.code === "EADDRINUSE") {
        resolve(findAvailablePort(startPort + 1));
        return;
      }

      reject(error);
    });

    server.listen(startPort, "0.0.0.0", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : startPort;
      server.close(() => resolve(port));
    });
  });
}

async function startServer() {
  const app = express();
  app.use(express.json());

  app.use('/api', (req, res, next) => {
    // Public endpoints that do not require database access
    if (req.path === '/health' || req.path.startsWith('/drug-safety') || req.path.startsWith('/debug/openfda')) {
      return next();
    }

    if (!supabase) {
      return res.status(503).json({
        error: 'Database is not configured. Add Supabase environment variables and restart the server.'
      });
    }

    next();
  });

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
      database: isSupabaseConfigured ? 'connected' : 'not configured',
      openfdaApiKey: process.env.OPENFDA_API_KEY ? 'configured' : 'NOT configured'
    });
  });

  // Debug endpoint for OpenFDA connectivity
  app.get('/api/debug/openfda', async (req, res) => {
    const apiKey = process.env.OPENFDA_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: 'OPENFDA_API_KEY not configured in .env' });
    }

    try {
      // Test simple query
      const testUrl = `https://api.fda.gov/drug/event.json?api_key=${apiKey}&limit=1`;
      const response = await fetch(testUrl);
      const data = await response.json();
      
      res.json({
        status: response.ok ? 'success' : 'failed',
        statusCode: response.status,
        hasResults: data.results && data.results.length > 0,
        totalAvailable: data.meta?.results?.total || 0,
        apiKeyPresent: !!apiKey
      });
    } catch (error: any) {
      res.status(500).json({ 
        error: 'Failed to connect to OpenFDA API',
        message: error.message 
      });
    }
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

  // OpenFDA Proxy - Public endpoint for drug safety info
  app.get("/api/drug-safety/:name", async (req, res) => {
    const drugName = req.params.name;
    const apiKey = process.env.OPENFDA_API_KEY;

    if (!apiKey) {
      console.warn("[OpenFDA] API Key not configured");
      return res.status(500).json({ 
        error: "OpenFDA API key not configured. Set OPENFDA_API_KEY in .env file."
      });
    }

    try {
      // Simplified search without complex query syntax
      // Just search for the drug name in all fields
      const searchUrl = `https://api.fda.gov/drug/event.json?search=${encodeURIComponent(drugName)}&limit=5&api_key=${apiKey}`;
      
      console.log(`[OpenFDA] Searching for: ${drugName}`);
      const response = await fetch(searchUrl);

      if (!response.ok) {
        console.error(`[OpenFDA] API returned status: ${response.status}`);
        return res.status(404).json({ 
          error: `Drug "${drugName}" not found in OpenFDA database. Try common drug names like 'Aspirin', 'Ibuprofen', or 'Acetaminophen'.`,
          results: [] 
        });
      }

      const data = await response.json();

      if (!data.results || data.results.length === 0) {
        console.warn(`[OpenFDA] No results for: ${drugName}`);
        return res.status(404).json({ 
          error: `No adverse events found for "${drugName}".`,
          results: [] 
        });
      }

      // Count serious cases
      let seriousCases = 0;
      try {
        const seriousUrl = `https://api.fda.gov/drug/event.json?search=${encodeURIComponent(drugName)}+AND+serious:1&limit=1&api_key=${apiKey}`;
        const seriousResponse = await fetch(seriousUrl);
        if (seriousResponse.ok) {
          const seriousData = await seriousResponse.json();
          seriousCases = seriousData.meta?.results?.total || 0;
        }
      } catch (e) {
        console.error("[OpenFDA] Error fetching serious cases:", e);
      }

      console.log(`[OpenFDA] Found ${data.meta?.results?.total || 0} reports with ${seriousCases} serious cases`);
      res.json({ ...data, seriousCases });
    } catch (error: any) {
      console.error("[OpenFDA] Request failed:", error.message);
      res.status(500).json({ 
        error: `API error: ${error.message}` 
      });
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
    const requestedPort = Number(process.env.PORT || 3000);
    const requestedHmrPort = Number(process.env.VITE_HMR_PORT || 24678);
    const appPort = await findAvailablePort(requestedPort);
    const hmrPort = await findAvailablePort(requestedHmrPort);

    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: {
          port: hmrPort,
          clientPort: hmrPort,
        },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);

    app.listen(appPort, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${appPort}`);
      if (appPort !== requestedPort) {
        console.log(`Requested port ${requestedPort} was busy, using ${appPort} instead.`);
      }
      if (hmrPort !== requestedHmrPort) {
        console.log(`Requested HMR port ${requestedHmrPort} was busy, using ${hmrPort} instead.`);
      }
    });
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
    const PORT = Number(process.env.PORT || 3000);
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

startServer();
