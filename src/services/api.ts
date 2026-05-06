const API_URL = import.meta.env.VITE_API_URL || '/api';
const FORCE_LOCAL_MODE = String(import.meta.env.VITE_FORCE_LOCAL_MODE || '').toLowerCase() === 'true';
const HAS_SUPABASE_FRONTEND_CONFIG = Boolean(
  String(import.meta.env.VITE_SUPABASE_URL || '').trim() &&
  String(import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()
);
const LOCAL_MODE_KEY = 'medguide_mode';

function setAppMode(mode: 'local' | 'server') {
  try {
    localStorage.setItem(LOCAL_MODE_KEY, mode);
  } catch {
    // Ignore storage failures.
  }
}

function getAppMode(): 'local' | 'server' {
  if (FORCE_LOCAL_MODE || !HAS_SUPABASE_FRONTEND_CONFIG) return 'local';

  try {
    const savedMode = localStorage.getItem(LOCAL_MODE_KEY);
    if (savedMode === 'local' || savedMode === 'server') return savedMode;

    // If app is already logged in with mock token, stay local-first.
    const token = localStorage.getItem('token');
    if (token === 'mock-jwt-token') return 'local';
  } catch {
    // Ignore read errors and use server mode by default.
  }

  return 'server';
}

function isLocalModeEnabled(): boolean {
  return getAppMode() === 'local';
}

function shouldUseLocalFallback(errorMessage: string): boolean {
  const msg = (errorMessage || '').toLowerCase();
  return (
    msg.includes('supabase') ||
    msg.includes('api request failed') ||
    msg.includes('backend api not available') ||
    msg.includes('database is not configured') ||
    msg.includes('forbidden') ||
    msg.includes('invalid credentials') ||
    msg.includes('invalid email or password') ||
    msg.includes('invalid token') ||
    msg.includes('401') ||
    msg.includes('403')
  );
}

function normalizeEmail(value: string): string {
  return (value || '').trim().toLowerCase();
}

function getSavedUsers(): any[] {
  try {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    return Array.isArray(users) ? users : [];
  } catch {
    return [];
  }
}

function getCurrentLocalUser() {
  try {
    return JSON.parse(localStorage.getItem('currentUser') || 'null');
  } catch {
    return null;
  }
}

function localLogin(normalizedCredentials: { email: string; password: string }) {
  const savedUsers = getSavedUsers();
  const match = savedUsers.find(
    (u: any) =>
      normalizeEmail(u.email || '') === normalizedCredentials.email &&
      (u.password || '').trim() === normalizedCredentials.password
  );
  if (!match) throw new Error('Invalid email or password.');
  const { password: _pw, ...user } = match;
  return { token: 'mock-jwt-token', user };
}

function localRegister(normalizedData: any) {
  const savedUsers = getSavedUsers();
  if (savedUsers.find((u: any) => normalizeEmail(u.email || '') === normalizedData.email)) {
    throw new Error('An account with this email already exists.');
  }
  const newUser = { id: Date.now(), ...normalizedData };
  localStorage.setItem('users', JSON.stringify([...savedUsers, newUser]));
  return { id: newUser.id };
}

function localGetUser() {
  const currentUser = getCurrentLocalUser();
  if (!currentUser) throw new Error('User not found in local session. Please login again.');
  return currentUser;
}

function readJsonCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.expiresAt || parsed.expiresAt < Date.now()) return null;
    return parsed.data as T;
  } catch {
    return null;
  }
}

function writeJsonCache(key: string, data: unknown, ttlMs: number) {
  try {
    localStorage.setItem(key, JSON.stringify({
      expiresAt: Date.now() + ttlMs,
      data,
    }));
  } catch {
    // Ignore storage errors.
  }
}

export const api = {
  async fetch(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('token');
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 5000);
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    };

    let response: Response;
    try {
      response = await fetch(`${API_URL}${endpoint}`, { ...options, headers, signal: controller.signal });
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        throw new Error(`API request timeout for ${endpoint}`);
      }
      throw error;
    } finally {
      window.clearTimeout(timeoutId);
    }

    const contentType = response.headers.get('content-type');
    const rawBody = await response.text();
    const trimmedBody = rawBody.trim();
    const looksLikeJson = trimmedBody.startsWith('{') || trimmedBody.startsWith('[');

    let parsedBody: any = null;
    if (looksLikeJson || (contentType && contentType.includes('application/json'))) {
      try {
        parsedBody = trimmedBody ? JSON.parse(rawBody) : null;
      } catch {
        throw new Error(`API returned invalid JSON for ${endpoint}. Check your deployed backend response.`);
      }
    }

    if (!response.ok) {
      if (parsedBody) {
        throw new Error(parsedBody.error || 'API request failed');
      } else {
        if (trimmedBody.includes('<!DOCTYPE') || trimmedBody.includes('<html')) {
          throw new Error('Backend API not available. Please check your VITE_API_URL configuration.');
        }
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
    }

    if (!parsedBody) {
      throw new Error('Expected JSON response but received HTML. Backend may not be deployed correctly.');
    }

    return parsedBody;
  },

  auth: {
    login: async (credentials: any) => {
      const normalizedCredentials = {
        ...credentials,
        email: normalizeEmail(credentials?.email || ''),
        password: (credentials?.password || '').trim(),
      };

      if (isLocalModeEnabled()) {
        return localLogin(normalizedCredentials);
      }

      try {
        const result = await api.fetch('/login', { method: 'POST', body: JSON.stringify(normalizedCredentials) });
        setAppMode('server');
        return result;
      } catch (e: any) {
        if (!shouldUseLocalFallback(e.message)) throw e;
        setAppMode('local');
        return localLogin(normalizedCredentials);
      }
    },
    register: async (data: any) => {
      const normalizedData = {
        ...data,
        email: normalizeEmail(data?.email || ''),
        password: (data?.password || '').trim(),
      };

      if (isLocalModeEnabled()) {
        return localRegister(normalizedData);
      }

      try {
        const result = await api.fetch('/register', { method: 'POST', body: JSON.stringify(normalizedData) });
        setAppMode('server');
        return result;
      } catch (e: any) {
        if (!shouldUseLocalFallback(e.message)) throw e;
        setAppMode('local');
        return localRegister(normalizedData);
      }
    },
    getUser: async () => {
      if (isLocalModeEnabled()) {
        return localGetUser();
      }

      try {
        return await api.fetch('/user');
      } catch (e: any) {
        if (!shouldUseLocalFallback(e.message)) throw e;
        setAppMode('local');
        return localGetUser();
      }
    },
  },

  medicines: {
    list: async () => {
      const cacheKey = 'cache_medicines';
      const cached = readJsonCache<any[]>(cacheKey);
      if (cached) return cached;

      if (isLocalModeEnabled()) {
        const fallback = JSON.parse(localStorage.getItem('mock_medicines') || '[]');
        writeJsonCache(cacheKey, fallback, 5 * 60 * 1000);
        return fallback;
      }

      try {
        const data = await api.fetch('/medicines');
        writeJsonCache(cacheKey, data, 5 * 60 * 1000);
        return data;
      } catch (e: any) {
        if (!shouldUseLocalFallback(e.message)) throw e;
        setAppMode('local');
        const fallback = JSON.parse(localStorage.getItem('mock_medicines') || '[]');
        writeJsonCache(cacheKey, fallback, 5 * 60 * 1000);
        return fallback;
      }
    },
    create: async (data: any) => {
      if (isLocalModeEnabled()) {
        const meds = JSON.parse(localStorage.getItem('mock_medicines') || '[]');
        const newMed = { ...data, id: Date.now() };
        localStorage.setItem('mock_medicines', JSON.stringify([newMed, ...meds]));
        localStorage.removeItem('cache_medicines');
        return { id: newMed.id };
      }

      try {
        return await api.fetch('/medicines', { method: 'POST', body: JSON.stringify(data) });
      } catch (e: any) {
        if (!shouldUseLocalFallback(e.message)) throw e;
        setAppMode('local');
        const meds = JSON.parse(localStorage.getItem('mock_medicines') || '[]');
        const newMed = { ...data, id: Date.now() };
        localStorage.setItem('mock_medicines', JSON.stringify([newMed, ...meds]));
        localStorage.removeItem('cache_medicines');
        return { id: newMed.id };
      }
    },
    delete: async (id: number) => {
      if (isLocalModeEnabled()) {
        const meds = JSON.parse(localStorage.getItem('mock_medicines') || '[]');
        localStorage.setItem('mock_medicines', JSON.stringify(meds.filter((m: any) => m.id !== id)));
        localStorage.removeItem('cache_medicines');
        return { success: true };
      }

      try {
        return await api.fetch(`/medicines/${id}`, { method: 'DELETE' });
      } catch (e: any) {
        if (!shouldUseLocalFallback(e.message)) throw e;
        setAppMode('local');
        const meds = JSON.parse(localStorage.getItem('mock_medicines') || '[]');
        localStorage.setItem('mock_medicines', JSON.stringify(meds.filter((m: any) => m.id !== id)));
        localStorage.removeItem('cache_medicines');
        return { success: true };
      }
    },
    update: async (id: number, data: any) => {
      try {
        const result = await api.fetch(`/medicines/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
        localStorage.removeItem('cache_medicines');
        return result;
      } catch (e: any) {
        // fallback: return null but don't block
        console.error('Failed to update medicine:', e.message || e);
        return null;
      }
    }
  },

  adherence: {
    list: async () => {
      const cacheKey = 'cache_adherence';
      const cached = readJsonCache<any[]>(cacheKey);
      if (cached) return cached;

      if (isLocalModeEnabled()) {
        const fallback = JSON.parse(localStorage.getItem('mock_adherence') || '[]');
        writeJsonCache(cacheKey, fallback, 5 * 60 * 1000);
        return fallback;
      }

      try {
        const data = await api.fetch('/adherence');
        writeJsonCache(cacheKey, data, 5 * 60 * 1000);
        return data;
      } catch (e: any) {
        if (!shouldUseLocalFallback(e.message)) throw e;
        setAppMode('local');
        const fallback = JSON.parse(localStorage.getItem('mock_adherence') || '[]');
        writeJsonCache(cacheKey, fallback, 5 * 60 * 1000);
        return fallback;
      }
    },
    record: async (data: { medication_id: number, status: string }) => {
      if (isLocalModeEnabled()) {
        const adherenceList = JSON.parse(localStorage.getItem('mock_adherence') || '[]');
        const meds = JSON.parse(localStorage.getItem('mock_medicines') || '[]');
        const med = meds.find((m: any) => m.id === data.medication_id) || { name: 'Unknown Medication' };

        const record = {
          id: Date.now(),
          ...data,
          medicine_name: med.name,
          timestamp: new Date().toISOString()
        };
        localStorage.setItem('mock_adherence', JSON.stringify([record, ...adherenceList]));
        localStorage.removeItem('cache_adherence');
        return { success: true };
      }

      try {
        const result = await api.fetch('/adherence', { method: 'POST', body: JSON.stringify(data) });
        localStorage.removeItem('cache_adherence');
        return result;
      } catch (e: any) {
        if (!shouldUseLocalFallback(e.message)) throw e;
        setAppMode('local');
        const adherenceList = JSON.parse(localStorage.getItem('mock_adherence') || '[]');
        const meds = JSON.parse(localStorage.getItem('mock_medicines') || '[]');
        const med = meds.find((m: any) => m.id === data.medication_id) || { name: 'Unknown Medication' };
        
        const record = { 
          id: Date.now(), 
          ...data,
          medicine_name: med.name,
          timestamp: new Date().toISOString()
        };
        localStorage.setItem('mock_adherence', JSON.stringify([record, ...adherenceList]));
        localStorage.removeItem('cache_adherence');
        return { success: true };
      }
    },
  },

  emergencyContact: {
    update: async (data: any) => {
      if (isLocalModeEnabled()) {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        if (!currentUser) {
          throw new Error('Cannot save contact in local mode without logged-in user.');
        }

        const updatedUser = {
          ...currentUser,
          emergency_contact_name: data.name,
          emergency_contact_email: data.email,
          emergency_contact_phone: data.phone,
        };

        localStorage.setItem('currentUser', JSON.stringify(updatedUser));

        const users = JSON.parse(localStorage.getItem('users') || '[]');
        if (Array.isArray(users) && users.length > 0) {
          const syncedUsers = users.map((u: any) =>
            u.id === updatedUser.id
              ? {
                  ...u,
                  emergency_contact_name: data.name,
                  emergency_contact_email: data.email,
                  emergency_contact_phone: data.phone,
                }
              : u
          );
          localStorage.setItem('users', JSON.stringify(syncedUsers));
        }

        return { success: true, user: updatedUser };
      }

      try {
        return await api.fetch('/emergency-contact', { method: 'POST', body: JSON.stringify(data) });
      } catch (e: any) {
        if (!shouldUseLocalFallback(e.message)) throw e;
        setAppMode('local');

        const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        if (!currentUser) {
          throw new Error('Cannot save contact in local mode without logged-in user.');
        }

        const updatedUser = {
          ...currentUser,
          emergency_contact_name: data.name,
          emergency_contact_email: data.email,
          emergency_contact_phone: data.phone,
        };

        localStorage.setItem('currentUser', JSON.stringify(updatedUser));

        // Also keep local registered users in sync for demo/local mode.
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        if (Array.isArray(users) && users.length > 0) {
          const syncedUsers = users.map((u: any) =>
            u.id === updatedUser.id
              ? {
                  ...u,
                  emergency_contact_name: data.name,
                  emergency_contact_email: data.email,
                  emergency_contact_phone: data.phone,
                }
              : u
          );
          localStorage.setItem('users', JSON.stringify(syncedUsers));
        }

        return { success: true, user: updatedUser };
      }
    },
  }
};

export const openFDA = {
  async getDrugReport(drugName: string) {
    const normalizedName = drugName.trim().toLowerCase();
    if (!normalizedName) return null;

    const cacheKey = `openfda_${normalizedName}`;

    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.expiresAt && parsed.expiresAt > Date.now()) {
          return parsed.data;
        }
      }
    } catch {
      // Ignore cache read failures and fall through to network.
    }

    // In local-only mode, try direct API first to avoid serverless cold-start delay.
    const fetchWithTimeout = async (url: string, timeoutMs = 8000) => {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
      try {
        return await fetch(url, { signal: controller.signal });
      } finally {
        window.clearTimeout(timeout);
      }
    };

    const buildSearchUrl = (query: string) =>
      `https://api.fda.gov/drug/event.json?search=${encodeURIComponent(query)}&limit=1`;

    const tryBackendProxy = async () => {
      const data = await api.fetch(`/drug-safety/${encodeURIComponent(drugName)}`);
      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          expiresAt: Date.now() + 12 * 60 * 60 * 1000,
          data,
        }));
      } catch {
        // Ignore cache write failures.
      }
      return data;
    };

    // Default behavior: backend proxy first (uses server key).
    if (!isLocalModeEnabled()) {
      try {
        return await tryBackendProxy();
      } catch (backendError) {
        console.error('Backend OpenFDA proxy failed', backendError);
      }
    }

    try {
      const [reportResponse, seriousResponse] = await Promise.all([
        fetchWithTimeout(buildSearchUrl(drugName), 5000),
        fetchWithTimeout(buildSearchUrl(`${drugName} AND serious:1`), 5000)
      ]);

      if (!reportResponse.ok) return null;

      const reportData = await reportResponse.json();
      const seriousData = seriousResponse.ok ? await seriousResponse.json() : null;
      const payload = {
        ...reportData,
        seriousCases: seriousData?.meta?.results?.total || 0,
      };

      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          expiresAt: Date.now() + 12 * 60 * 60 * 1000,
          data: payload,
        }));
      } catch {
        // Ignore cache write failures.
      }

      return payload;
    } catch (directError) {
      console.error('Direct OpenFDA fetch also failed', directError);

      // In local mode, fallback to backend proxy as last attempt.
      if (isLocalModeEnabled()) {
        try {
          return await tryBackendProxy();
        } catch (backendError) {
          console.error('Backend OpenFDA fallback failed', backendError);
        }
      }

      return null;
    }
  },

  async getDrugInfo(drugName: string) {
    try {
      const data = await openFDA.getDrugReport(drugName);
      if (!data) return null;
      if (!data.results || data.results.length === 0) return null;

      const result = data.results[0];
      const sideEffects = result.patient.reaction.map((r: any) => r.reactionmeddrapt).slice(0, 3).join(', ');
      const totalReports = data.meta.results.total;
      const seriousCases = data.seriousCases || 0;
      
      let riskLevel: 'Low' | 'Moderate' | 'High' = 'Low';
      if (totalReports > 10000 || seriousCases > 1000) riskLevel = 'High';
      else if (totalReports > 1000 || seriousCases > 100) riskLevel = 'Moderate';

      return {
        sideEffects,
        totalReports,
        seriousCases,
        riskLevel
      };
    } catch (e) {
      console.error('OpenFDA error', e);
      return null;
    }
  }
};
