CREATE TABLE "realtime_presence" (
	"page_id" uuid NOT NULL,
	"client_id" bigint NOT NULL,
	"session_id" text NOT NULL,
	"clock" bigint NOT NULL,
	"state" jsonb,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "realtime_presence_page_id_client_id_pk" PRIMARY KEY("page_id","client_id")
);
--> statement-breakpoint
ALTER TABLE "realtime_presence" ADD CONSTRAINT "realtime_presence_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "realtime_presence" ADD CONSTRAINT "realtime_presence_session_id_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "realtime_presence_expires_at_index" ON "realtime_presence" USING btree ("expires_at");