import fp from 'fastify-plugin'
import type { FastifyPluginAsync } from 'fastify'
import { prisma } from './prisma.client.js'
import type { PrismaClient } from '../../generated/prisma/client.js'

// Extend Fastify's type system so every route handler knows about app.db
declare module 'fastify' {
  interface FastifyInstance {
    db: PrismaClient
  }
}

const databasePlugin: FastifyPluginAsync = async (fastify) => {
  // Decorate the Fastify instance — all modules can now access fastify.db
  fastify.decorate('db', prisma)

  // Graceful shutdown: disconnect from DB when server closes
  fastify.addHook('onClose', async () => {
    await prisma.$disconnect()
    fastify.log.info('Database disconnected')
  })
}

// fp() breaks encapsulation — the 'db' decoration is visible to ALL modules
export default fp(databasePlugin, {
  fastify: '5.x',
  name: 'database',
})
