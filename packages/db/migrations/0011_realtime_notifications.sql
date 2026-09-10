-- Transactional notifications: delivered only on commit, including worker and auth writes.
CREATE FUNCTION digipm_notify_change() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE item jsonb; previous jsonb; workspace text; page text; actor text;
BEGIN
  item := CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;
  IF TG_TABLE_NAME = 'pages' AND TG_OP = 'UPDATE' THEN
    previous := to_jsonb(OLD);
    IF (item - 'updated_at') = (previous - 'updated_at') THEN RETURN NULL; END IF;
  END IF;
  workspace := COALESCE(item->>'workspace_id', item->>'organization_id');
  page := item->>'page_id';
  IF TG_TABLE_NAME = 'pages' THEN page := item->>'id'; END IF;
  IF TG_TABLE_NAME = 'organization' THEN workspace := item->>'id'; END IF;
  IF workspace IS NULL AND page IS NOT NULL THEN
    SELECT workspace_id::text INTO workspace FROM pages WHERE id = page::uuid;
  END IF;
  IF workspace IS NULL AND item ? 'source_id' THEN
    SELECT workspace_id::text INTO workspace FROM data_sources WHERE id = (item->>'source_id')::uuid;
  END IF;
  IF TG_TABLE_NAME = 'team_member' THEN
    SELECT organization_id::text INTO workspace FROM team WHERE id = item->>'team_id';
  END IF;
  IF TG_TABLE_NAME IN ('favorites','session','user','codex_connections','codex_conversations') THEN
    actor := item->>'user_id';
    IF TG_TABLE_NAME = 'user' THEN actor := item->>'id'; END IF;
  END IF;
  IF item ? 'conversation_id' THEN
    SELECT user_id, workspace_id::text INTO actor, workspace FROM codex_conversations WHERE id = (item->>'conversation_id')::uuid;
  END IF;
  PERFORM pg_notify('digipm_changes', jsonb_build_object('table', TG_TABLE_NAME, 'workspaceId', workspace, 'pageId', page, 'userId', actor)::text);
  RETURN NULL;
END $$;
--> statement-breakpoint
DO $$ DECLARE name text; BEGIN
  FOREACH name IN ARRAY ARRAY['pages','page_documents','page_grants','favorites','data_sources','database_entries','property_definitions','property_values','database_views','assets','organization','member','invitation','team','team_member','session','user','codex_connections','codex_conversations','codex_messages','codex_proposals','pm_settings','pm_subjects','pm_context_bindings','pm_runs','pm_questionnaires','pm_artifacts','pm_reviews','realtime_presence'] LOOP
    EXECUTE format('CREATE TRIGGER realtime_change AFTER INSERT OR UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION digipm_notify_change()', name);
  END LOOP;
END $$;
