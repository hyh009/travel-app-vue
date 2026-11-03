-- CreateTable
CREATE TABLE "Attraction" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "town" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "isFree" BOOLEAN NOT NULL,
    "website" TEXT,

    CONSTRAINT "Attraction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Attraction_lat_lng_idx" ON "Attraction"("lat", "lng");

-- CreateIndex
CREATE INDEX "Attraction_city_idx" ON "Attraction"("city");
