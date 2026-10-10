ALTER TABLE "cms"."post_revision" ADD COLUMN "title" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "cms"."post_revision" ADD COLUMN "content" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "cms"."post_revision" ADD COLUMN "content_html" text;--> statement-breakpoint
ALTER TABLE "cms"."post_revision" ADD COLUMN "excerpt" varchar(500);--> statement-breakpoint
ALTER TABLE "cms"."posts" ADD COLUMN "content_html" text;--> statement-breakpoint
ALTER TABLE "cms"."posts" ADD COLUMN "excerpt" varchar(500);--> statement-breakpoint
ALTER TABLE "cms"."post_revision" ALTER COLUMN "revision_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "cms"."posts" ALTER COLUMN "content" SET DATA TYPE jsonb USING "content"::jsonb;--> statement-breakpoint
ALTER TABLE "cms"."post_revision" DROP CONSTRAINT "post_revision_revision_id_post_revision_id_fkey", ADD CONSTRAINT "post_revision_revision_id_post_revision_id_fkey" FOREIGN KEY ("revision_id") REFERENCES "cms"."post_revision"("id") ON DELETE SET NULL;