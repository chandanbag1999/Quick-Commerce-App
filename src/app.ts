import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import { env } from './config/env.js'
import { AppError } from './shared/errors/http.errors.js'
import healthModule from './modules/health/health.module.js'

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
      transport:
        env.NODE_ENV !== 'production'
          ? {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
    },
  })

  await app.register(helmet, { contentSecurityPolicy: false })

  await app.register(cors, {
    origin: env.NODE_ENV === 'production' ? ['https://your-frontend.com'] : true,
    credentials: true,
  })

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please wait before making more requests.',
    }),
  })

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'GoBasket API',
        description: 'Quick Commerce Backend — like Zepto',
        version: '1.0.0',
      },
      servers: [{ url: `http://localhost:${env.PORT}`, description: 'Development server' }],
      tags: [
        { name: 'Health', description: 'Health check' },
        { name: 'Auth', description: 'Authentication' },
        { name: 'Products', description: 'Product management' },
        { name: 'Cart', description: 'Shopping cart' },
        { name: 'Orders', description: 'Order management' },
        { name: 'Payments', description: 'Payment processing' },
      ],
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
      },
    },
  })

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: { docExpansion: 'list', deepLinking: false },
  })

  // Domain modules
  await app.register(healthModule)

  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error)

    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        success: false,
        error: { code: error.code, message: error.message },
      })
    }

    if (error.validation) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: error.validation },
      })
    }

    return reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: env.NODE_ENV === 'production' ? 'Something went wrong' : error.message,
      },
    })
  })

  app.get(
    '/health',
    {
      schema: {
        tags: ['Health'],
        description: 'Check if the server is running',
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              timestamp: { type: 'string' },
              uptime: { type: 'number' },
              environment: { type: 'string' },
            },
          },
        },
      },
    },
    async (_request, reply) => {
      return reply.send({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: env.NODE_ENV,
      })
    }
  )

  return app
}
