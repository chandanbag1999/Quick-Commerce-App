import type { FastifyRequest, FastifyReply } from 'fastify'
import { HealthService } from './health.service.js'

const healthService = new HealthService()

export async function getHealthStatus(
  _request: FastifyRequest,
  reply: FastifyReply
) {
  const status = healthService.getStatus()
  return reply.send(status)
}
