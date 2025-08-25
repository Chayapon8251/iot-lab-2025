CREATE TABLE "drinks" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"price_cents" integer NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"order_id" bigint NOT NULL,
	"drink_id" bigint NOT NULL,
	"qty" integer NOT NULL,
	"unit_price_cents" integer NOT NULL,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"note" text,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "books_categories" ALTER COLUMN "book_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "books_categories" ALTER COLUMN "category_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_drink_id_drinks_id_fk" FOREIGN KEY ("drink_id") REFERENCES "public"."drinks"("id") ON DELETE no action ON UPDATE no action;