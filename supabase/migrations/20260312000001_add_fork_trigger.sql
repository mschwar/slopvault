-- Add trigger to sync nodes.fork_count when nodes are forked
-- This keeps the denormalized fork_count in sync with the parent-child relationships

CREATE OR REPLACE FUNCTION public.handle_fork_change()
RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.parent_node_id IS NOT NULL) THEN
    -- A new fork was created, increment parent's fork_count
    UPDATE public.nodes 
    SET fork_count = fork_count + 1 
    WHERE id = NEW.parent_node_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE' AND OLD.parent_node_id IS NOT NULL) THEN
    -- A fork was deleted, decrement parent's fork_count
    UPDATE public.nodes 
    SET fork_count = fork_count - 1 
    WHERE id = OLD.parent_node_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_fork_change
  AFTER INSERT OR DELETE ON public.nodes
  FOR EACH ROW EXECUTE PROCEDURE public.handle_fork_change();

-- Add index for fork depth queries (used by Rabbit Holes feed)
CREATE INDEX idx_nodes_fork_count ON public.nodes(fork_count DESC, created_at DESC);
