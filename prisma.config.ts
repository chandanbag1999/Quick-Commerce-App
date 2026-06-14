import { config } from 'dotenv'
import { defineConfig } from 'prisma/config'

// Load .env before Prisma reads env vars
config()

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // Using process.env directly (not env() helper) so server starts
    // even when DATABASE_URL is a placeholder during development
    url: process.env.DATABASE_URL ?? '',
  },
})
