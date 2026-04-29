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
  async getDrugInfo(drugName: string) {
    try {
      const data = await api.fetch(`/drug-safety/${encodeURIComponent(drugName)}`);
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
