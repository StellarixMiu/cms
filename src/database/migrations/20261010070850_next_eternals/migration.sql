CREATE TYPE "cms"."announcement_priority" AS ENUM('low', 'normal', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "cms"."post_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "cms"."post_type" AS ENUM('blog', 'announcement');--> statement-breakpoint
CREATE TABLE "cms"."categories" (
	"id" uuid PRIMARY KEY,
	"name" varchar(100) NOT NULL,
	"slug" varchar(120) NOT NULL,
	"updated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"updated_by" varchar(255),
	"created_by" varchar(255),
	"deleted_by" varchar(255),
	"description" text,
	"is_deleted" boolean,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "cms"."media" (
	"id" uuid PRIMARY KEY,
	"file_name" varchar(255) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"storage_key" text NOT NULL UNIQUE,
	"url" text,
	"alt_text" varchar(255),
	"size" bigint NOT NULL,
	"width" integer,
	"height" integer,
	"updated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"updated_by" varchar(255),
	"created_by" varchar(255),
	"deleted_by" varchar(255),
	"description" text,
	"is_deleted" boolean,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "cms"."post_revision" (
	"id" uuid PRIMARY KEY,
	"post_id" uuid NOT NULL,
	"revision_id" uuid NOT NULL,
	"version" varchar(24) NOT NULL,
	"updated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"updated_by" varchar(255),
	"created_by" varchar(255),
	"deleted_by" varchar(255),
	"description" text,
	"is_deleted" boolean,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "cms"."post_tags" (
	"id" uuid NOT NULL,
	"post_id" uuid,
	"tag_id" uuid,
	"updated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"updated_by" varchar(255),
	"created_by" varchar(255),
	"deleted_by" varchar(255),
	"description" text,
	"is_deleted" boolean,
	"notes" text,
	CONSTRAINT "post_tags_pkey" PRIMARY KEY("post_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "cms"."posts" (
	"id" uuid PRIMARY KEY,
	"type" "cms"."post_type" NOT NULL,
	"status" "cms"."post_status" DEFAULT 'draft'::"cms"."post_status" NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar(280) NOT NULL,
	"content" text NOT NULL,
	"category_id" uuid,
	"cover_media_id" uuid,
	"priority" "cms"."announcement_priority",
	"expires_at" timestamp with time zone,
	"is_pinned" integer DEFAULT 0 NOT NULL,
	"published_at" timestamp with time zone,
	"updated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"updated_by" varchar(255),
	"created_by" varchar(255),
	"deleted_by" varchar(255),
	"description" text,
	"is_deleted" boolean,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "cms"."tags" (
	"id" uuid PRIMARY KEY,
	"name" varchar(100) NOT NULL,
	"slug" varchar(120) NOT NULL,
	"updated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"updated_by" varchar(255),
	"created_by" varchar(255),
	"deleted_by" varchar(255),
	"description" text,
	"is_deleted" boolean,
	"notes" text
);
--> statement-breakpoint
CREATE UNIQUE INDEX "categories_slug_uidx" ON "cms"."categories" ("slug");--> statement-breakpoint
CREATE INDEX "media_mime_type_idx" ON "cms"."media" ("mime_type");--> statement-breakpoint
CREATE INDEX "post_tags_tag_id_idx" ON "cms"."post_tags" ("tag_id");--> statement-breakpoint
CREATE UNIQUE INDEX "posts_slug_uidx" ON "cms"."posts" ("slug");--> statement-breakpoint
CREATE INDEX "posts_type_status_idx" ON "cms"."posts" ("type","status");--> statement-breakpoint
CREATE INDEX "posts_published_at_idx" ON "cms"."posts" ("published_at");--> statement-breakpoint
CREATE INDEX "posts_category_id_idx" ON "cms"."posts" ("category_id");--> statement-breakpoint
CREATE INDEX "posts_expires_at_idx" ON "cms"."posts" ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "tags_slug_uidx" ON "cms"."tags" ("slug");--> statement-breakpoint
ALTER TABLE "cms"."post_revision" ADD CONSTRAINT "post_revision_post_id_posts_id_fkey" FOREIGN KEY ("post_id") REFERENCES "cms"."posts"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "cms"."post_revision" ADD CONSTRAINT "post_revision_revision_id_post_revision_id_fkey" FOREIGN KEY ("revision_id") REFERENCES "cms"."post_revision"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "cms"."post_tags" ADD CONSTRAINT "post_tags_post_id_posts_id_fkey" FOREIGN KEY ("post_id") REFERENCES "cms"."posts"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "cms"."post_tags" ADD CONSTRAINT "post_tags_tag_id_tags_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "cms"."tags"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "cms"."posts" ADD CONSTRAINT "posts_category_id_categories_id_fkey" FOREIGN KEY ("category_id") REFERENCES "cms"."categories"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "cms"."posts" ADD CONSTRAINT "posts_cover_media_id_media_id_fkey" FOREIGN KEY ("cover_media_id") REFERENCES "cms"."media"("id") ON DELETE SET NULL;