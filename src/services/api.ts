const API_URL = import.meta.env.VITE_API_URL || '/api';

export const api = {
  async fetch(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

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
      try {
        return await api.fetch('/login', { method: 'POST', body: JSON.stringify(credentials) });
      } catch (e: any) {
        if (!e.message.includes('Supabase') && !e.message.includes('API request failed')) throw e;
        const savedUsers = JSON.parse(localStorage.getItem('users') || '[]');
        const match = savedUsers.find((u: any) => u.email === credentials.email && u.password === credentials.password);
        if (!match) throw new Error('Invalid email or password.');
        const { password: _pw, ...user } = match;
        return { token: 'mock-jwt-token', user };
      }
    },
    register: async (data: any) => {
      try {
        return await api.fetch('/register', { method: 'POST', body: JSON.stringify(data) });
      } catch (e: any) {
        if (!e.message.includes('Supabase') && !e.message.includes('API request failed')) throw e;
        const savedUsers = JSON.parse(localStorage.getItem('users') || '[]');
        if (savedUsers.find((u: any) => u.email === data.email)) throw new Error('An account with this email already exists.');
        const newUser = { id: Date.now(), ...data };
        localStorage.setItem('users', JSON.stringify([...savedUsers, newUser]));
        return { id: newUser.id };
      }
    },
    getUser: () => api.fetch('/user'),
  },

  medicines: {
    list: async () => {
      try {
        return await api.fetch('/medicines');
      } catch (e: any) {
        if (!e.message.includes('Supabase') && !e.message.includes('API request failed') && !e.message.includes('401')) throw e;
        return JSON.parse(localStorage.getItem('mock_medicines') || '[]');
      }
    },
    create: async (data: any) => {
      try {
        return await api.fetch('/medicines', { method: 'POST', body: JSON.stringify(data) });
      } catch (e: any) {
        if (!e.message.includes('Supabase') && !e.message.includes('API request failed') && !e.message.includes('401')) throw e;
        const meds = JSON.parse(localStorage.getItem('mock_medicines') || '[]');
        const newMed = { ...data, id: Date.now() };
        localStorage.setItem('mock_medicines', JSON.stringify([newMed, ...meds]));
        return { id: newMed.id };
      }
    },
    delete: async (id: number) => {
      try {
        return await api.fetch(`/medicines/${id}`, { method: 'DELETE' });
      } catch (e: any) {
        if (!e.message.includes('Supabase') && !e.message.includes('API request failed') && !e.message.includes('401')) throw e;
        const meds = JSON.parse(localStorage.getItem('mock_medicines') || '[]');
        localStorage.setItem('mock_medicines', JSON.stringify(meds.filter((m: any) => m.id !== id)));
        return { success: true };
      }
    },
    update: async (id: number, data: any) => {
      try {
        return await api.fetch(`/medicines/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
      } catch (e: any) {
        // fallback: return null but don't block
        console.error('Failed to update medicine:', e.message || e);
        return null;
      }
    }
  },

  adherence: {
    list: async () => {
      try {
        return await api.fetch('/adherence');
      } catch (e: any) {
        if (!e.message.includes('Supabase') && !e.message.includes('API request failed') && !e.message.includes('401')) throw e;
        return JSON.parse(localStorage.getItem('mock_adherence') || '[]');
      }
    },
    record: async (data: { medication_id: number, status: string }) => {
      try {
        return await api.fetch('/adherence', { method: 'POST', body: JSON.stringify(data) });
      } catch (e: any) {
        if (!e.message.includes('Supabase') && !e.message.includes('API request failed') && !e.message.includes('401')) throw e;
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
        return { success: true };
      }
    },
  },

  emergencyContact: {
    update: (data: any) => api.fetch('/emergency-contact', { method: 'POST', body: JSON.stringify(data) }),
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

    try {
      const [reportResponse, seriousResponse] = await Promise.all([
        fetchWithTimeout(buildSearchUrl(drugName)),
        fetchWithTimeout(buildSearchUrl(`${drugName} AND serious:1`))
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
      console.error('Direct OpenFDA fetch failed, using backend fallback', directError);
    }

    try {
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
    } catch (fallbackError) {
      console.error('OpenFDA fallback failed', fallbackError);
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
