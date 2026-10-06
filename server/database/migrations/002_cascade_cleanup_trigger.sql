-- Nexura PostgreSQL Trigger Migration
-- Auto-clean dangling task IDs from sprints array on task deletion

CREATE OR REPLACE FUNCTION public.fn_cleanup_sprint_task_ids()
RETURNS TRIGGER AS $$
BEGIN
  -- Hapus OLD.id dan OLD.task_id dari array task_ids di seluruh tabel sprints
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
