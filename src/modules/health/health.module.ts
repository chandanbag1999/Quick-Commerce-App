import fp from 'fastify-plugin'
import type { FastifyPluginAsync } from 'fastify'
import { healthRoutes } from './health.routes.js'

const healthModule: FastifyPluginAsync = async (fastify) => {
  fastify.register(healthRoutes, { prefix: '/api/v1' })
}

export default fp(healthModule, {
  fastify: '5.x',
  name: 'health-module',
})
