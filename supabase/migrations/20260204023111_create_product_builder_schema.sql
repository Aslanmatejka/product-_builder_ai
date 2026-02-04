/*
  # Product Builder Database Schema

  1. New Tables
    - `projects`
      - `id` (uuid, primary key)
      - `name` (text) - Project name
      - `created_at` (timestamptz) - When project was created
      - `updated_at` (timestamptz) - Last modification time
      - `design_data` (jsonb) - Design specifications
      - `status` (text) - Project status (draft, building, completed, error)
    
    - `builds`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects)
      - `build_number` (integer) - Sequential build number for the project
      - `prompt` (text) - User prompt for this build
      - `created_at` (timestamptz) - When build started
      - `completed_at` (timestamptz) - When build finished
      - `status` (text) - Build status (building, success, error)
      - `design_data` (jsonb) - Generated design specifications
      - `files` (jsonb) - Generated file paths
      - `component_models` (jsonb) - PCB component model data
      - `feedback` (jsonb) - Engine feedback and compatibility checks
      - `error_message` (text) - Error message if build failed
      - `ai_model` (text) - AI model used for planning
      - `is_assembly` (boolean) - Whether this is an assembly build
      - `assembly_info` (jsonb) - Assembly information if applicable
    
    - `messages`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects)
      - `build_id` (uuid, foreign key to builds, nullable)
      - `type` (text) - Message type (user, assistant)
      - `content` (text) - Message content
      - `created_at` (timestamptz) - When message was sent
      - `metadata` (jsonb) - Additional message metadata

  2. Security
    - Enable RLS on all tables
    - For now, allow public access since there's no auth yet
    - When auth is added, policies should restrict to user's own data
*/

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Untitled Project',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  design_data jsonb,
  status text DEFAULT 'draft' NOT NULL
);

-- Create builds table
CREATE TABLE IF NOT EXISTS builds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  build_number integer NOT NULL DEFAULT 1,
  prompt text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  completed_at timestamptz,
  status text DEFAULT 'building' NOT NULL,
  design_data jsonb,
  files jsonb,
  component_models jsonb,
  feedback jsonb,
  error_message text,
  ai_model text,
  is_assembly boolean DEFAULT false,
  assembly_info jsonb
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  build_id uuid REFERENCES builds(id) ON DELETE CASCADE,
  type text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  metadata jsonb
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_builds_project_id ON builds(project_id);
CREATE INDEX IF NOT EXISTS idx_builds_created_at ON builds(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_project_id ON messages(project_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE builds ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (temporary - until auth is added)
-- These allow anyone to access any project for now

CREATE POLICY "Allow public read access to projects"
  ON projects FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to projects"
  ON projects FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to projects"
  ON projects FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from projects"
  ON projects FOR DELETE
  TO public
  USING (true);

CREATE POLICY "Allow public read access to builds"
  ON builds FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to builds"
  ON builds FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to builds"
  ON builds FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from builds"
  ON builds FOR DELETE
  TO public
  USING (true);

CREATE POLICY "Allow public read access to messages"
  ON messages FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to messages"
  ON messages FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to messages"
  ON messages FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from messages"
  ON messages FOR DELETE
  TO public
  USING (true);
