export interface User {
  id: number;
  name: string;
  email: string;
  emergency_contact_name?: string;
  emergency_contact_email?: string;
  emergency_contact_phone?: string;
}

export interface Medication {
  id: number;
  user_id: number;
  name: string;
  dosage: string;
  frequency: string;
  reminder_time: string;
  days_of_week?: string;
  start_date: string;
  end_date?: string;
  risk_level?: 'Low' | 'Moderate' | 'High';
  side_effects?: string;
  total_reports?: number;
  serious_cases?: number;
}

export interface AdherenceRecord {
  id: number;
  medication_id: number;
  medicine_name: string;
  status: 'taken' | 'skipped' | 'missed';
  timestamp: string;
}
