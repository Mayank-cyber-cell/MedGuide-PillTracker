const API_URL = '/api';

export const api = {
  async fetch(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API request failed');
    }
    return response.json();
  },

  auth: {
    login: (credentials: any) => api.fetch('/login', { method: 'POST', body: JSON.stringify(credentials) }),
    register: (data: any) => api.fetch('/register', { method: 'POST', body: JSON.stringify(data) }),
    getUser: () => api.fetch('/user'),
  },

  medicines: {
    list: () => api.fetch('/medicines'),
    create: (data: any) => api.fetch('/medicines', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: number) => api.fetch(`/medicines/${id}`, { method: 'DELETE' }),
  },

  adherence: {
    list: () => api.fetch('/adherence'),
    record: (data: { medication_id: number, status: string }) => api.fetch('/adherence', { method: 'POST', body: JSON.stringify(data) }),
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
