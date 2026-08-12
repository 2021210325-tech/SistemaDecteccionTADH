import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

export function createNeonAdapter() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL!,
    ssl: {
      rejectUnauthorized: false,
    },
  })
  return new PrismaPg(pool)
}