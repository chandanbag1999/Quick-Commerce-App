import type { FastifyInstance } from 'fastify'
import { getHealthStatus } from './health.controller.js'
import { healthResponseSchema } from './health.schema.js'
import type { HealthStatus } from './health.types.js'

export async function healthRoutes(fastify: FastifyInstance) {
  fastify.get<{ Reply: { 200: HealthStatus } }>(
    '/health',
    {
      schema: {
        tags: ['Health'],
        summary: 'Server health check',
        description: 'Returns server status, uptime, and environment info',
        response: { 200: healthResponseSchema },
      },
    },
    getHealthStatus
  )
}
