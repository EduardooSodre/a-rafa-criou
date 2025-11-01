DROP TABLE "content_blocks" CASCADE;--> statement-breakpoint
DROP TABLE "content_pages" CASCADE;--> statement-breakpoint
DROP TABLE "content_versions" CASCADE;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "coupon_code" varchar(100);