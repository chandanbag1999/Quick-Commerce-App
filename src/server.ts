import { buildApp } from './app.js'
import { env } from './config/env.js'

async function start() {
  const app = await buildApp()

  try {
    await app.listen({ port: env.PORT, host: env.HOST })
    process.stdout.write(`
╔══════════════════════════════════════════╗
║       GoBasket Backend Started           ║
║                                          ║
║  Server : http://localhost:${env.PORT}           ║
║  Docs   : http://localhost:${env.PORT}/docs      ║
║  Health : http://localhost:${env.PORT}/health    ║
║  Env    : ${env.NODE_ENV.padEnd(32)}║
╚══════════════════════════════════════════╝\n`)
  } catch (error) {
    app.log.error(error)
    process.exit(1)
  }
}

start()
