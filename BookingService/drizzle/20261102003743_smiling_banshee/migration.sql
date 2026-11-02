CREATE TYPE "booking_status" AS ENUM('PENDING', 'CONFIRMED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "idempotency_key_status" AS ENUM('ACTIVE', 'FINALIZED', 'EXPIRED');--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"hotel_id" uuid NOT NULL,
	"room_category_id" uuid NOT NULL,
	"customer_email" varchar(255) NOT NULL,
	"check_in" date NOT NULL,
	"check_out" date NOT NULL,
	"room_count" integer NOT NULL,
	"booking_amount" integer NOT NULL,
	"status" "booking_status" DEFAULT 'PENDING'::"booking_status" NOT NULL,
	"hold_expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookings_valid_stay" CHECK ("check_in" < "check_out"),
	CONSTRAINT "bookings_positive_room_count" CHECK ("room_count" > 0),
	CONSTRAINT "bookings_positive_amount" CHECK ("booking_amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "idempotency_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"idempotency_key" uuid NOT NULL CONSTRAINT "idempotency_keys_key_unique" UNIQUE,
	"booking_id" uuid NOT NULL CONSTRAINT "idempotency_keys_booking_id_unique" UNIQUE,
	"status" "idempotency_key_status" DEFAULT 'ACTIVE'::"idempotency_key_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "idempotency_keys" ADD CONSTRAINT "idempotency_keys_booking_id_bookings_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE;