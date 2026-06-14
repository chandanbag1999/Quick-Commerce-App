export const healthResponseSchema = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['ok', 'degraded', 'down'] },
    timestamp: { type: 'string', format: 'date-time' },
    uptime: { type: 'number' },
    environment: { type: 'string' },
    version: { type: 'string' },
  },
  required: ['status', 'timestamp', 'uptime', 'environment', 'version'],
} as const
