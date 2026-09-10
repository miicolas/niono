CREATE TABLE "codex_connections" (
	"user_id" text PRIMARY KEY NOT NULL,
	"status" text DEFAULT 'disconnected' NOT NULL,
	"email" text,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "codex_conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"workspace_id" uuid NOT NULL,
	"thread_id" text,
	"title" text NOT NULL,
	"status" text DEFAULT 'idle' NOT NULL,
	"sources" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"context" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "codex_conversations_id_user_id_workspace_id_unique" UNIQUE("id","user_id","workspace_id")
);
--> statement-breakpoint
CREATE TABLE "codex_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"request_id" uuid NOT NULL,
	"role" text NOT NULL,
	"text" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'idle' NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "codex_messages_conversation_id_request_id_role_unique" UNIQUE("conversation_id","request_id","role")
);
--> statement-breakpoint
CREATE TABLE "codex_proposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"workspace_id" uuid NOT NULL,
	"request_id" uuid NOT NULL,
	"action" jsonb NOT NULL,
	"before" text NOT NULL,
	"summary" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"result" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "codex_connections" ADD CONSTRAINT "codex_connections_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "codex_conversations" ADD CONSTRAINT "codex_conversations_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "codex_conversations" ADD CONSTRAINT "codex_conversations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "codex_messages" ADD CONSTRAINT "codex_messages_conversation_id_codex_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."codex_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "codex_proposals" ADD CONSTRAINT "codex_proposals_conversation_id_user_id_workspace_id_codex_conversations_id_user_id_workspace_id_fk" FOREIGN KEY ("conversation_id","user_id","workspace_id") REFERENCES "public"."codex_conversations"("id","user_id","workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "codex_conversations_user_id_workspace_id_updated_at_index" ON "codex_conversations" USING btree ("user_id","workspace_id","updated_at");--> statement-breakpoint
CREATE INDEX "codex_messages_conversation_id_created_at_index" ON "codex_messages" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "codex_proposals_conversation_id_index" ON "codex_proposals" USING btree ("conversation_id");