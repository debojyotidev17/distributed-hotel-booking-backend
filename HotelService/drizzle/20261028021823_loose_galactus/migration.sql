CREATE TYPE "room_type" AS ENUM('SINGLE', 'DOUBLE', 'FAMILY', 'DELUXE', 'SUITE');--> statement-breakpoint
CREATE TYPE "state_type" AS ENUM('STATE', 'UNION_TERRITORY');--> statement-breakpoint
CREATE TABLE "availability_periods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"room_category_id" uuid NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"rooms_per_night" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "availability_periods_valid_range" CHECK ("start_date" < "end_date"),
	CONSTRAINT "availability_periods_positive_room_count" CHECK ("rooms_per_night" > 0)
);
--> statement-breakpoint
CREATE TABLE "cities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(100) NOT NULL,
	"state_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cities_name_state_id_unique" UNIQUE("name","state_id")
);
--> statement-breakpoint
CREATE TABLE "hotels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(100) NOT NULL,
	"address" text NOT NULL,
	"city_id" uuid NOT NULL,
	"rating" real DEFAULT 0 NOT NULL,
	"rating_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hotels_city_name_address_unique" UNIQUE("city_id","name","address")
);
--> statement-breakpoint
CREATE TABLE "physical_rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"room_category_id" uuid NOT NULL,
	"room_number" varchar(20) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "physical_rooms_category_number_unique" UNIQUE("room_category_id","room_number")
);
--> statement-breakpoint
CREATE TABLE "room_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"hotel_id" uuid NOT NULL,
	"room_type" "room_type" NOT NULL,
	"price" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "room_categories_hotel_id_room_type_unique" UNIQUE("hotel_id","room_type"),
	CONSTRAINT "room_categories_price_positive" CHECK ("price" > 0)
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"physical_room_id" uuid NOT NULL,
	"date_of_availability" date NOT NULL,
	"price" integer NOT NULL,
	"booking_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rooms_physical_room_date_unique" UNIQUE("physical_room_id","date_of_availability"),
	CONSTRAINT "rooms_price_positive" CHECK ("price" > 0)
);
--> statement-breakpoint
CREATE TABLE "states" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(100) NOT NULL UNIQUE,
	"code" varchar(3) NOT NULL UNIQUE,
	"type" "state_type" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "availability_periods" ADD CONSTRAINT "availability_periods_room_category_id_room_categories_id_fkey" FOREIGN KEY ("room_category_id") REFERENCES "room_categories"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "cities" ADD CONSTRAINT "cities_state_id_states_id_fkey" FOREIGN KEY ("state_id") REFERENCES "states"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "hotels" ADD CONSTRAINT "hotels_city_id_cities_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "physical_rooms" ADD CONSTRAINT "physical_rooms_room_category_id_room_categories_id_fkey" FOREIGN KEY ("room_category_id") REFERENCES "room_categories"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "room_categories" ADD CONSTRAINT "room_categories_hotel_id_hotels_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_physical_room_id_physical_rooms_id_fkey" FOREIGN KEY ("physical_room_id") REFERENCES "physical_rooms"("id") ON DELETE CASCADE;