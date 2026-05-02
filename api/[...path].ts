import express from 'express';
import dotenv from 'dotenv';
import serverless from 'serverless-http';

dotenv.config();

let supabase: any = null;
let isSupabaseConfigured = false;
const getSupabase = () => {
  if (supabase) return supabase;
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);
  if (!isSupabaseConfigured) return null;
  const { createClient } = require('@supabase/supabase-js');
  supabase = createClient(supabaseUrl!, supabaseKey!);
  return supabase;
};

const JWT_SECRET = process.env.JWT_SECRET || 'medguide-secret-key-123';

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  if (req.path === '/health' || req.path.startsWith('/drug-safety') || req.path.startsWith('/debug/openfda')) {
    return next();
  }

  if (!supabase) {
    return res.status(503).json({
      error: 'Database is not configured. Add Supabase environment variables and redeploy.'
    });
  }

  next();
});

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    database: isSupabaseConfigured ? 'connected' : 'not configured',
    openfdaApiKey: process.env.OPENFDA_API_KEY ? 'configured' : 'NOT configured'
  });
});

app.get('/debug/openfda', async (req, res) => {
  const apiKey = process.env.OPENFDA_API_KEY;
  if (!apiKey) {
    return res.status(400).json({ error: 'OPENFDA_API_KEY not configured' });
  }

  try {
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

app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ error: 'Database is not configured. Add Supabase environment variables and redeploy.' });

    const { data: existingUser } = await sb
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);
    const { data, error } = await sb
      .from('users')
      .insert([{ name, email, password: hashedPassword }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ id: data.id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ error: 'Database is not configured. Add Supabase environment variables and redeploy.' });

    const { data: user, error } = await sb
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    const bcrypt = require('bcryptjs');
    const jwt = require('jsonwebtoken');

    if (error || !user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/user', authenticateToken, async (req: any, res) => {
  try {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ error: 'Database is not configured. Add Supabase environment variables and redeploy.' });

    const { data: user, error } = await sb
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

app.post('/emergency-contact', authenticateToken, async (req: any, res) => {
  const { name, email, phone } = req.body;
  try {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ error: 'Database is not configured. Add Supabase environment variables and redeploy.' });

    const { error } = await sb
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

app.get('/drug-safety/:name', async (req, res) => {
  const drugName = req.params.name;
  const apiKey = process.env.OPENFDA_API_KEY;

  if (!apiKey) {
    console.error('[OpenFDA] OPENFDA_API_KEY is not configured in environment variables');
    return res.status(503).json({
      error: 'Drug safety database is currently unavailable. Please ensure OPENFDA_API_KEY is configured in Vercel environment variables.',
      results: []
    });
  }

  try {
    // keep the payload small in serverless
    const searchUrl = `https://api.fda.gov/drug/event.json?search=${encodeURIComponent(drugName)}&limit=1&api_key=${apiKey}`;
    const response = await fetch(searchUrl);

    if (!response.ok) {
      console.error(`[OpenFDA] API returned ${response.status} for drug: ${drugName}`);
      return res.status(404).json({
        error: `Drug "${drugName}" not found in OpenFDA database. Try common drug names like 'Aspirin', 'Ibuprofen', or 'Acetaminophen'.`,
        results: []
      });
    }

    const data = await response.json();
    if (!data.results || data.results.length === 0) {
      console.warn(`[OpenFDA] No results found for drug: ${drugName}`);
      return res.status(404).json({
        error: `No adverse events found for "${drugName}".`,
        results: []
      });
    }

    let seriousCases = 0;
    try {
      const seriousUrl = `https://api.fda.gov/drug/event.json?search=${encodeURIComponent(drugName)}+AND+serious:1&limit=1&api_key=${apiKey}`;
      const seriousResponse = await fetch(seriousUrl);
      if (seriousResponse.ok) {
        const seriousData = await seriousResponse.json();
        seriousCases = seriousData.meta?.results?.total || 0;
      }
    } catch (e) {
      console.error('[OpenFDA] Error fetching serious cases:', e);
    }

    console.log(`[OpenFDA] Successfully fetched data for ${drugName}: ${data.results.length} results`);
    res.json({ ...data, seriousCases });
  } catch (error: any) {
    console.error('[OpenFDA] Fetch error:', error.message);
    res.status(500).json({ 
      error: `API error: ${error.message}`,
      results: []
    });
  }
});

app.get('/medicines', authenticateToken, async (req: any, res) => {
  try {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ error: 'Database is not configured. Add Supabase environment variables and redeploy.' });

    const { data: medicines, error } = await sb
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

app.post('/medicines', authenticateToken, async (req: any, res) => {
  const { name, dosage, frequency, reminder_time, days_of_week, start_date, end_date, risk_level, side_effects, total_reports, serious_cases } = req.body;
  try {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ error: 'Database is not configured. Add Supabase environment variables and redeploy.' });

    const { data, error } = await sb
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

app.delete('/medicines/:id', authenticateToken, async (req: any, res) => {
  try {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ error: 'Database is not configured. Add Supabase environment variables and redeploy.' });

    const { error } = await sb
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

app.get('/adherence', authenticateToken, async (req: any, res) => {
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

app.post('/adherence', authenticateToken, async (req: any, res) => {
  const { medication_id, status } = req.body;

  try {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ error: 'Database is not configured. Add Supabase environment variables and redeploy.' });

    const { data: med, error: medError } = await sb
      .from('medications')
      .select('*')
      .eq('id', medication_id)
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (medError || !med) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { error } = await supabase
      .from('adherence')
      .insert([{ medication_id, status }]);

    if (error) throw error;
    res.status(201).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Partial update for a medication (used by the client to update OpenFDA fields asynchronously)
app.patch('/medicines/:id', authenticateToken, async (req: any, res) => {
  const id = req.params.id;
  const updates = req.body;
  try {
    const sb = getSupabase();
    if (!sb) return res.status(503).json({ error: 'Database is not configured. Add Supabase environment variables and redeploy.' });

    const { data, error } = await sb
      .from('medications')
      .update(updates)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, id: data.id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default serverless(app);
