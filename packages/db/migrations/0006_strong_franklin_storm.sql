CREATE TABLE "pm_artifacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"key" text NOT NULL,
	"hash" text NOT NULL,
	"page_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"format" text NOT NULL,
	"document_revision" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pm_artifacts_run_id_key_unique" UNIQUE("run_id","key")
);
--> statement-breakpoint
CREATE TABLE "pm_context_bindings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"subject_id" uuid,
	"scope" text NOT NULL,
	"page_id" uuid NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pm_context_bindings_workspace_id_scope_page_id_unique" UNIQUE("workspace_id","scope","page_id")
);
--> statement-breakpoint
CREATE TABLE "pm_questionnaires" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"key" text NOT NULL,
	"definition" jsonb NOT NULL,
	"answers" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"native_ids" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"revision" integer DEFAULT 0 NOT NULL,
	"submission_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pm_questionnaires_run_id_key_unique" UNIQUE("run_id","key")
);
--> statement-breakpoint
CREATE TABLE "pm_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"key" text NOT NULL,
	"persona" text NOT NULL,
	"thread_id" text,
	"status" text DEFAULT 'running' NOT NULL,
	"text" text DEFAULT '' NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pm_reviews_run_id_key_unique" UNIQUE("run_id","key")
);
--> statement-breakpoint
CREATE TABLE "pm_runs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"conversation_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"workspace_id" uuid NOT NULL,
	"subject_id" uuid,
	"workflow_id" text,
	"pack_version" text NOT NULL,
	"status" text DEFAULT 'running' NOT NULL,
	"steps" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"web_sources" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pm_settings" (
	"workspace_id" uuid PRIMARY KEY NOT NULL,
	"company_name" text DEFAULT 'Digitevent' NOT NULL,
	"company_page_id" uuid NOT NULL,
	"drafts_page_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pm_subjects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"page_id" uuid NOT NULL,
	"drafts_page_id" uuid NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pm_subjects_workspace_id_id_unique" UNIQUE("workspace_id","id"),
	CONSTRAINT "pm_subjects_page_id_unique" UNIQUE("page_id")
);
--> statement-breakpoint
ALTER TABLE "codex_conversations" ADD COLUMN "pm_pack_version" text;--> statement-breakpoint
ALTER TABLE "codex_conversations" ADD COLUMN "pm_subject_id" uuid;--> statement-breakpoint
ALTER TABLE "codex_conversations" ADD COLUMN "continued_from" uuid;--> statement-breakpoint
ALTER TABLE "pm_artifacts" ADD CONSTRAINT "pm_artifacts_run_id_pm_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."pm_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pm_artifacts" ADD CONSTRAINT "pm_artifacts_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pm_artifacts" ADD CONSTRAINT "pm_artifacts_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pm_context_bindings" ADD CONSTRAINT "pm_context_bindings_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pm_context_bindings" ADD CONSTRAINT "pm_context_bindings_workspace_id_page_id_pages_workspace_id_id_fk" FOREIGN KEY ("workspace_id","page_id") REFERENCES "public"."pages"("workspace_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pm_context_bindings" ADD CONSTRAINT "pm_context_bindings_workspace_id_subject_id_pm_subjects_workspace_id_id_fk" FOREIGN KEY ("workspace_id","subject_id") REFERENCES "public"."pm_subjects"("workspace_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pm_questionnaires" ADD CONSTRAINT "pm_questionnaires_run_id_pm_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."pm_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pm_reviews" ADD CONSTRAINT "pm_reviews_run_id_pm_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."pm_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pm_runs" ADD CONSTRAINT "pm_runs_conversation_id_user_id_workspace_id_codex_conversations_id_user_id_workspace_id_fk" FOREIGN KEY ("conversation_id","user_id","workspace_id") REFERENCES "public"."codex_conversations"("id","user_id","workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pm_runs" ADD CONSTRAINT "pm_runs_workspace_id_subject_id_pm_subjects_workspace_id_id_fk" FOREIGN KEY ("workspace_id","subject_id") REFERENCES "public"."pm_subjects"("workspace_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pm_settings" ADD CONSTRAINT "pm_settings_workspace_id_organization_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pm_settings" ADD CONSTRAINT "pm_settings_company_page_id_pages_id_fk" FOREIGN KEY ("company_page_id") REFERENCES "public"."pages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pm_settings" ADD CONSTRAINT "pm_settings_drafts_page_id_pages_id_fk" FOREIGN KEY ("drafts_page_id") REFERENCES "public"."pages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pm_subjects" ADD CONSTRAINT "pm_subjects_workspace_id_organization_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pm_subjects" ADD CONSTRAINT "pm_subjects_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pm_subjects" ADD CONSTRAINT "pm_subjects_drafts_page_id_pages_id_fk" FOREIGN KEY ("drafts_page_id") REFERENCES "public"."pages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pm_subjects" ADD CONSTRAINT "pm_subjects_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pm_subjects" ADD CONSTRAINT "pm_subjects_workspace_id_page_id_pages_workspace_id_id_fk" FOREIGN KEY ("workspace_id","page_id") REFERENCES "public"."pages"("workspace_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pm_runs_conversation_id_created_at_index" ON "pm_runs" USING btree ("conversation_id","created_at");