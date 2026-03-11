/*
  # Create MedGuide Database Schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `name` (text)
      - `email` (text, unique)
      - `password` (text, encrypted)
      - `emergency_contact_name` (text, optional)
      - `emergency_contact_email` (text, optional)
      - `emergency_contact_phone` (text, optional)
      - `created_at` (timestamptz)
    
    - `medications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `name` (text)
      - `dosage` (text)
      - `frequency` (text)
      - `reminder_time` (text)
      - `days_of_week` (text)
      - `start_date` (date)
      - `end_date` (date, optional)
      - `risk_level` (text)
      - `side_effects` (text)
      - `total_reports` (integer)
      - `serious_cases` (integer)
      - `created_at` (timestamptz)
    
    - `adherence`
      - `id` (uuid, primary key)
      - `medication_id` (uuid, foreign key)
      - `status` (text: 'taken', 'skipped', 'missed')
      - `timestamp` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Users can only access their own medications and adherence records
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  emergency_contact_name text,
  emergency_contact_email text,
  emergency_contact_phone text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  TO authenticated
  USING (id = (current_setting('app.user_id', true))::uuid);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  TO authenticated
  USING (id = (current_setting('app.user_id', true))::uuid)
  WITH CHECK (id = (current_setting('app.user_id', true))::uuid);

-- Create medications table
CREATE TABLE IF NOT EXISTS medications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  dosage text NOT NULL,
  frequency text NOT NULL DEFAULT 'Daily',
  reminder_time text NOT NULL,
  days_of_week text DEFAULT '0,1,2,3,4,5,6',
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  risk_level text DEFAULT 'Low',
  side_effects text DEFAULT 'No common side effects reported',
  total_reports integer DEFAULT 0,
  serious_cases integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own medications"
  ON medications FOR SELECT
  TO authenticated
  USING (user_id = (current_setting('app.user_id', true))::uuid);

CREATE POLICY "Users can insert own medications"
  ON medications FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (current_setting('app.user_id', true))::uuid);

CREATE POLICY "Users can update own medications"
  ON medications FOR UPDATE
  TO authenticated
  USING (user_id = (current_setting('app.user_id', true))::uuid)
  WITH CHECK (user_id = (current_setting('app.user_id', true))::uuid);

CREATE POLICY "Users can delete own medications"
  ON medications FOR DELETE
  TO authenticated
  USING (user_id = (current_setting('app.user_id', true))::uuid);

-- Create adherence table
CREATE TABLE IF NOT EXISTS adherence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id uuid NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('taken', 'skipped', 'missed')),
  timestamp timestamptz DEFAULT now()
);

ALTER TABLE adherence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view adherence for own medications"
  ON adherence FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM medications
      WHERE medications.id = adherence.medication_id
      AND medications.user_id = (current_setting('app.user_id', true))::uuid
    )
  );

CREATE POLICY "Users can insert adherence for own medications"
  ON adherence FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM medications
      WHERE medications.id = adherence.medication_id
      AND medications.user_id = (current_setting('app.user_id', true))::uuid
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_medications_user_id ON medications(user_id);
CREATE INDEX IF NOT EXISTS idx_adherence_medication_id ON adherence(medication_id);
CREATE INDEX IF NOT EXISTS idx_adherence_timestamp ON adherence(timestamp);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
