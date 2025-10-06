ALTER TABLE "product_images" ALTER COLUMN "size" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "product_images" ADD COLUMN "cloudinary_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "product_images" ADD COLUMN "url" text NOT NULL;--> statement-breakpoint
ALTER TABLE "product_images" ADD COLUMN "width" integer;--> statement-breakpoint
ALTER TABLE "product_images" ADD COLUMN "height" integer;--> statement-breakpoint
ALTER TABLE "product_images" ADD COLUMN "format" varchar(10);--> statement-breakpoint
ALTER TABLE "product_images" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "product_images" DROP COLUMN "original_name";--> statement-breakpoint
ALTER TABLE "product_images" DROP COLUMN "mime_type";--> statement-breakpoint
ALTER TABLE "product_images" DROP COLUMN "data";