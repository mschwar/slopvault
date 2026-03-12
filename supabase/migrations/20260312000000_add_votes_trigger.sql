-- Add trigger to sync nodes.upvotes when votes are inserted/deleted
-- This keeps the denormalized upvotes count in sync with the votes table

CREATE OR REPLACE FUNCTION public.handle_vote_change()
RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.nodes 
    SET upvotes = upvotes + 1 
    WHERE id = NEW.node_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.nodes 
    SET upvotes = upvotes - 1 
    WHERE id = OLD.node_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_vote_change
  AFTER INSERT OR DELETE ON public.votes
  FOR EACH ROW EXECUTE PROCEDURE public.handle_vote_change();

-- Add index for hot ranking queries (upvotes weighted by recency)
CREATE INDEX idx_nodes_upvotes_created ON public.nodes(upvotes DESC, created_at DESC);
