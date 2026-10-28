BEGIN;

-- Migration 003: System alignment and RLS lockdown
-- 1. Extend tasks status check constraint
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_status_check CHECK (status IN ('idea', 'in_queue', 'running_sprint', 'deployed', 'blocked'));

-- 2. Create public.project_notes table
CREATE TABLE IF NOT EXISTS public.project_notes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  project_slug TEXT NOT NULL REFERENCES public.projects(slug) ON UPDATE CASCADE ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('idea', 'bug', 'maintenance')),
  content TEXT NOT NULL,
  promoted_task_id TEXT REFERENCES public.tasks(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_project_notes_slug ON public.project_notes(project_slug);

-- 3. Add release_phase column to projects table
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS release_phase TEXT NOT NULL DEFAULT 'v1.0';

-- 4. Lockdown RLS (Row Level Security)
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
DROP POLICY IF EXISTS "Allow full access for workspace" ON public.projects;
DROP POLICY IF EXISTS "Allow full access for workspace" ON public.sprints;
DROP POLICY IF EXISTS "Allow full access for workspace" ON public.tasks;

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on projects" ON public.projects;
CREATE POLICY "Service role full access on projects" ON public.projects FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on sprints" ON public.sprints;
CREATE POLICY "Service role full access on sprints" ON public.sprints FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on tasks" ON public.tasks;
CREATE POLICY "Service role full access on tasks" ON public.tasks FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on project_notes" ON public.project_notes;
CREATE POLICY "Service role full access on project_notes" ON public.project_notes FOR ALL TO service_role USING (true) WITH CHECK (true);

COMMIT;
