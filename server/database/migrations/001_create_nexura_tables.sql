-- Nexura Core PostgreSQL Schema Migration
-- Projects, Sprints, Tasks

-- 1. Projects
CREATE TABLE IF NOT EXISTS public.projects (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'planned', 'on-hold', 'completed', 'archived')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  github_repo TEXT,
  deploy_url TEXT,
  tech_stack TEXT[] DEFAULT '{}',
  start_date DATE,
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Sprints
CREATE TABLE IF NOT EXISTS public.sprints (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('planning', 'active', 'completed')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  task_ids TEXT[] DEFAULT '{}',
  velocity NUMERIC DEFAULT 0,
  objective TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Tasks
CREATE TABLE IF NOT EXISTS public.tasks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  task_id TEXT UNIQUE NOT NULL,
  project_slug TEXT REFERENCES public.projects(slug) ON UPDATE CASCADE ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'in_queue' CHECK (status IN ('in_queue', 'running_sprint', 'deployed', 'blocked')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  tech_tags TEXT[] DEFAULT '{}',
  due_date DATE,
  sprint_id TEXT REFERENCES public.sprints(id) ON DELETE SET NULL,
  date TEXT,
  github_issue_url TEXT,
  github_issue_number INTEGER,
  github_pr_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for maximum query performance
CREATE INDEX IF NOT EXISTS idx_tasks_project_slug ON public.tasks(project_slug);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_sprint_id ON public.tasks(sprint_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Allow full access for personal workspace
DROP POLICY IF EXISTS "Allow full access for workspace" ON public.projects;
CREATE POLICY "Allow full access for workspace" ON public.projects FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access for workspace" ON public.sprints;
CREATE POLICY "Allow full access for workspace" ON public.sprints FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access for workspace" ON public.tasks;
CREATE POLICY "Allow full access for workspace" ON public.tasks FOR ALL USING (true) WITH CHECK (true);
