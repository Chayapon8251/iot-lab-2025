CREATE TABLE "books_categories" (
	"book_id" bigint,
	"category_id" bigint,
	CONSTRAINT "books_categories_book_id_category_id_pk" PRIMARY KEY("book_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "detail" text;--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "synopsis" text;--> statement-breakpoint
ALTER TABLE "books_categories" ADD CONSTRAINT "books_categories_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "books_categories" ADD CONSTRAINT "books_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;