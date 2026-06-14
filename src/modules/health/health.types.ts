export interface HealthStatus {
  status: 'ok' | 'degraded' | 'down'
  timestamp: string
  uptime: number
  environment: string
  version: string
}
