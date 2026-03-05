CREATE TABLE "forecasts" (
	"id" serial PRIMARY KEY NOT NULL,
	"location_id" integer NOT NULL,
	"activity" text NOT NULL,
	"date" date NOT NULL,
	"time_range" text NOT NULL,
	"score" integer NOT NULL,
	"condition" text NOT NULL,
	"wind" jsonb,
	"tide" jsonb,
	"water" jsonb,
	"temp" jsonb,
	"precipitation" jsonb,
	"daylight" jsonb,
	"uv" jsonb,
	"humidity" jsonb,
	"visibility" jsonb,
	"summary" text,
	"analysis" text,
	"hourly" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "forecasts_location_activity_date_time_range_unique" UNIQUE("location_id","activity","date","time_range")
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"area" text NOT NULL,
	"city_slug" text NOT NULL,
	"latitude" numeric NOT NULL,
	"longitude" numeric NOT NULL,
	"time_zone" text NOT NULL,
	"source" text DEFAULT 'curated' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "forecasts" ADD CONSTRAINT "forecasts_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "locations_city_slug_idx" ON "locations" USING btree ("city_slug");--> statement-breakpoint
CREATE UNIQUE INDEX "locations_lat_lng_idx" ON "locations" USING btree ("latitude","longitude");