-- ==============================================================================
-- NEXURA PRODUCTION DATABASE INITIALIZATION SCRIPT (ALL-IN-ONE)
-- Execute this entire script once in Supabase SQL Editor:
-- Dashboard -> SQL Editor -> New Query -> Paste & RUN
-- ==============================================================================

BEGIN;

-- 1. Create Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'planned', 'on-hold', 'completed', 'archived')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  release_phase TEXT NOT NULL DEFAULT 'v1.0',
  github_repo TEXT,
  deploy_url TEXT,
  tech_stack TEXT[] DEFAULT '{}',
  start_date DATE,
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure release_phase column exists if table was created in an earlier revision
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS release_phase TEXT NOT NULL DEFAULT 'v1.0';

-- 2. Create Sprints Table
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

-- 3. Create Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  task_id TEXT UNIQUE NOT NULL,
  project_slug TEXT REFERENCES public.projects(slug) ON UPDATE CASCADE ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'in_queue' CHECK (status IN ('idea', 'in_queue', 'running_sprint', 'deployed', 'blocked')),
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

-- Ensure task status constraint allows 'idea' if table was created in an earlier revision
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_status_check CHECK (status IN ('idea', 'in_queue', 'running_sprint', 'deployed', 'blocked'));

-- 4. Create Project Notes Table
CREATE TABLE IF NOT EXISTS public.project_notes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  project_slug TEXT NOT NULL REFERENCES public.projects(slug) ON UPDATE CASCADE ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('idea', 'bug', 'maintenance')),
  content TEXT NOT NULL,
  promoted_task_id TEXT REFERENCES public.tasks(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Create Performance Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_project_slug ON public.tasks(project_slug);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_sprint_id ON public.tasks(sprint_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_project_notes_slug ON public.project_notes(project_slug);

-- 6. Lockdown Row Level Security (RLS) & Policies
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_notes ENABLE ROW LEVEL SECURITY;

-- Drop legacy open access policies if present
DROP POLICY IF EXISTS "Allow full access for workspace" ON public.projects;
DROP POLICY IF EXISTS "Allow full access for workspace" ON public.sprints;
DROP POLICY IF EXISTS "Allow full access for workspace" ON public.tasks;
DROP POLICY IF EXISTS "Allow full access for workspace" ON public.project_notes;

-- Enforce service_role policies idempotently
DROP POLICY IF EXISTS "Service role full access on projects" ON public.projects;
CREATE POLICY "Service role full access on projects" ON public.projects FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on sprints" ON public.sprints;
CREATE POLICY "Service role full access on sprints" ON public.sprints FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on tasks" ON public.tasks;
CREATE POLICY "Service role full access on tasks" ON public.tasks FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on project_notes" ON public.project_notes;
CREATE POLICY "Service role full access on project_notes" ON public.project_notes FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 7. Trigger: Auto-Clean Dangling Task IDs From Sprints on Task Deletion
CREATE OR REPLACE FUNCTION public.fn_cleanup_sprint_task_ids()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.sprints
  SET task_ids = array_remove(array_remove(task_ids, OLD.id), OLD.task_id),
      updated_at = now()
  WHERE task_ids @> ARRAY[OLD.id] OR task_ids @> ARRAY[OLD.task_id];
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cleanup_sprint_task_ids ON public.tasks;
CREATE TRIGGER trg_cleanup_sprint_task_ids
AFTER DELETE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.fn_cleanup_sprint_task_ids();

COMMIT;
