import { readFile } from 'node:fs/promises'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'

const BATCH_SIZE = 1000
const DATA_FILE = new URL('../../data/attractions.json', import.meta.url)

const rawAttractionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  city: z.string().min(1),
  town: z.string(),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  is_free: z.boolean(),
  website: z.string().nullish(),
})

async function main() {
  const raw = JSON.parse(await readFile(DATA_FILE, 'utf-8'))
  const rows = z
    .array(rawAttractionSchema)
    .parse(raw)
    .map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      city: a.city,
      town: a.town,
      lat: a.lat,
      lng: a.lon,
      isFree: a.is_free,
      website: a.website ?? null,
    }))
  console.log(`Read ${rows.length} attractions`)

  const batches = []
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    batches.push(prisma.attraction.createMany({ data: rows.slice(i, i + BATCH_SIZE) }))
  }
  await prisma.$transaction([prisma.attraction.deleteMany(), ...batches])

  console.log(`Seeded ${await prisma.attraction.count()} attractions`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
