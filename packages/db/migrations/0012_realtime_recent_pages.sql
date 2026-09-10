CREATE FUNCTION digipm_notify_recent_page() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE item jsonb; workspace text;
BEGIN
  item := CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;
  SELECT workspace_id::text INTO workspace FROM pages WHERE id = (item->>'page_id')::uuid;
  PERFORM pg_notify('digipm_changes', jsonb_build_object('table', 'recent_pages', 'workspaceId', workspace, 'userId', item->>'user_id', 'pageId', item->>'page_id')::text);
  RETURN NULL;
END $$;
--> statement-breakpoint
CREATE TRIGGER realtime_recent_change AFTER INSERT OR UPDATE OR DELETE ON recent_pages FOR EACH ROW EXECUTE FUNCTION digipm_notify_recent_page();
