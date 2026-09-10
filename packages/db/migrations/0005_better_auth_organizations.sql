-- Preserve content references and existing memberships while transferring ownership to Better Auth.
ALTER TABLE "workspaces" RENAME TO "organization";
--> statement-breakpoint
ALTER TABLE "organization" RENAME CONSTRAINT "workspaces_pkey" TO "organization_pkey";
--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "slug" text, ADD COLUMN "logo" text, ADD COLUMN "metadata" text;
--> statement-breakpoint
UPDATE "organization" SET "slug" = 'espace-' || "id"::text;
--> statement-breakpoint
ALTER TABLE "organization" ALTER COLUMN "slug" SET NOT NULL, ADD CONSTRAINT "organization_slug_unique" UNIQUE ("slug");
--> statement-breakpoint
ALTER TABLE "workspace_members" RENAME TO "member";
--> statement-breakpoint
ALTER TABLE "member" RENAME COLUMN "workspace_id" TO "organization_id";
--> statement-breakpoint
ALTER TABLE "member" ADD COLUMN "id" text, ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
UPDATE "member" m SET "id" = gen_random_uuid()::text, "created_at" = o."created_at" FROM "organization" o WHERE o."id" = m."organization_id";
--> statement-breakpoint
ALTER TABLE "member" DROP CONSTRAINT "workspace_members_workspace_id_user_id_pk", ADD PRIMARY KEY ("id"), ADD CONSTRAINT "member_organization_id_user_id_unique" UNIQUE ("organization_id", "user_id"), ALTER COLUMN "role" SET DEFAULT 'member';
--> statement-breakpoint
ALTER TABLE "member" RENAME CONSTRAINT "workspace_members_workspace_id_workspaces_id_fk" TO "member_organization_id_organization_id_fk";
--> statement-breakpoint
ALTER TABLE "member" RENAME CONSTRAINT "workspace_members_user_id_user_id_fk" TO "member_user_id_user_id_fk";
--> statement-breakpoint
CREATE INDEX "member_user_id_index" ON "member" ("user_id");
--> statement-breakpoint
ALTER TABLE "invitations" RENAME TO "invitation";
--> statement-breakpoint
ALTER TABLE "invitation" RENAME COLUMN "workspace_id" TO "organization_id";
--> statement-breakpoint
ALTER TABLE "invitation" RENAME CONSTRAINT "invitations_pkey" TO "invitation_pkey";
--> statement-breakpoint
ALTER TABLE "invitation" ALTER COLUMN "id" DROP DEFAULT, ALTER COLUMN "id" TYPE text USING "id"::text, ALTER COLUMN "role" DROP NOT NULL, ADD COLUMN "team_id" text, ADD COLUMN "status" text DEFAULT 'pending' NOT NULL, ADD COLUMN "inviter_id" text;
--> statement-breakpoint
-- Legacy hashed links cannot be converted to Better Auth invitation IDs. Preserve their history and require re-invitation.
UPDATE "invitation" i SET "status" = CASE WHEN i."accepted_at" IS NOT NULL THEN 'accepted' ELSE 'canceled' END, "inviter_id" = o."created_by" FROM "organization" o WHERE o."id" = i."organization_id";
--> statement-breakpoint
ALTER TABLE "invitation" ALTER COLUMN "inviter_id" SET NOT NULL, ADD CONSTRAINT "invitation_inviter_id_user_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "user" ("id") ON DELETE CASCADE, DROP COLUMN "token_hash", DROP COLUMN "accepted_at", DROP COLUMN "updated_at";
--> statement-breakpoint
ALTER TABLE "invitation" RENAME CONSTRAINT "invitations_workspace_id_workspaces_id_fk" TO "invitation_organization_id_organization_id_fk";
--> statement-breakpoint
CREATE INDEX "invitation_organization_id_index" ON "invitation" ("organization_id");
--> statement-breakpoint
CREATE INDEX "invitation_email_index" ON "invitation" ("email");
--> statement-breakpoint
ALTER TABLE "organization" DROP COLUMN "created_by", DROP COLUMN "updated_at";
--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "active_organization_id" text, ADD COLUMN "active_team_id" text;
--> statement-breakpoint
ALTER TABLE "pages" RENAME CONSTRAINT "pages_workspace_id_workspaces_id_fk" TO "pages_workspace_id_organization_id_fk";
--> statement-breakpoint
ALTER TABLE "data_sources" RENAME CONSTRAINT "data_sources_workspace_id_workspaces_id_fk" TO "data_sources_workspace_id_organization_id_fk";
--> statement-breakpoint
ALTER TABLE "import_jobs" RENAME CONSTRAINT "import_jobs_workspace_id_workspaces_id_fk" TO "import_jobs_workspace_id_organization_id_fk";
--> statement-breakpoint
ALTER TABLE "codex_conversations" RENAME CONSTRAINT "codex_conversations_workspace_id_workspaces_id_fk" TO "codex_conversations_workspace_id_organization_id_fk";
--> statement-breakpoint
CREATE TABLE "team" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "organization_id" uuid NOT NULL,
  "member_count" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone,
  CONSTRAINT "team_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organization" ("id") ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE "team_member" (
  "id" text PRIMARY KEY NOT NULL,
  "team_id" text NOT NULL,
  "user_id" text NOT NULL,
  "membership_key" text,
  "created_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "team_member_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "team" ("id") ON DELETE CASCADE,
  CONSTRAINT "team_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE,
  CONSTRAINT "team_member_membership_key_unique" UNIQUE ("membership_key"),
  CONSTRAINT "team_member_team_id_user_id_unique" UNIQUE ("team_id", "user_id")
);
--> statement-breakpoint
CREATE INDEX "team_organization_id_index" ON "team" ("organization_id");
--> statement-breakpoint
CREATE INDEX "team_member_user_id_index" ON "team_member" ("user_id");
--> statement-breakpoint
-- Content writes already lock organization rows. Serialize native membership changes with those writes.
CREATE FUNCTION lock_membership_content() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM 1 FROM organization WHERE id = OLD.organization_id FOR UPDATE;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER member_content_lock BEFORE UPDATE OR DELETE ON "member" FOR EACH ROW EXECUTE FUNCTION lock_membership_content();
