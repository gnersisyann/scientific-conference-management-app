import 'dotenv/config'
import { serve } from '@hono/node-server'
import { OpenAPIHono } from '@hono/zod-openapi'
import { cors } from 'hono/cors'
import { swaggerUI } from '@hono/swagger-ui'

import scientists from './routes/scientists.js'
import conferences from './routes/conferences.js'
import participations from './routes/participations.js'

const app = new OpenAPIHono()

const PORT = Number(process.env.SCONF_API_PORT) || Number(process.env.PORT) || 3000
const VERSION = process.env.SCONF_API_VERSION || '1.0.0'
const API_PREFIX = process.env.SCONF_API_PREFIX || '/api'
const NODE_ENV = process.env.SCONF_API_NODE_ENV || process.env.NODE_ENV || 'development'
const CORS_ORIGINS = process.env.SCONF_CORS_ORIGIN?.split(',') || 
                    process.env.CORS_ORIGIN?.split(',') || 
                    ['http://localhost:3000', 'http://localhost:3001']

app.use('/*', cors({
  origin: CORS_ORIGINS,
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}))

app.get('/', (c) => {
  return c.json({
    message: 'Scientific Conference Management API',
    version: VERSION,
    environment: NODE_ENV,
    endpoints: {
      scientists: `${API_PREFIX}/scientists`,
      conferences: `${API_PREFIX}/conferences`,
      participations: `${API_PREFIX}/participations`,
      docs: '/ui'
    }
  })
})

app.get('/health', (c) => {
  return c.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: VERSION,
    environment: NODE_ENV
  })
})

app.route(`${API_PREFIX}/scientists`, scientists)
app.route(`${API_PREFIX}/conferences`, conferences)
app.route(`${API_PREFIX}/participations`, participations)

app.doc('/doc', {
  openapi: '3.0.0',
  info: {
    version: VERSION,
    title: 'Scientific Conference Management API',
    description: 'API for managing scientific conferences, scientists and participations'
  },
  servers: [
    {
      url: `http://localhost:${PORT}`,
      description: NODE_ENV === 'development' ? 'Development server' : 'Local server'
    }
  ],
  tags: [
    {
      name: 'Scientists',
      description: 'Operations with scientists'
    },
    {
      name: 'Conferences', 
      description: 'Operations with conferences'
    },
    {
      name: 'Participations',
      description: 'Operations with participations in conferences'
    }
  ]
})

app.get('/ui', swaggerUI({ url: '/doc' }))

serve({
  fetch: app.fetch,
  port: PORT
}, (info) => {
  console.log(`🚀 Server is running on http://localhost:${info.port}`)
  console.log(`📚 API Documentation:`)
  console.log(`   - Swagger UI: http://localhost:${info.port}/ui`)
  console.log(`   - OpenAPI JSON: http://localhost:${info.port}/doc`)
  console.log(`🔗 API Endpoints:`)
  console.log(`   - Scientists: http://localhost:${info.port}${API_PREFIX}/scientists`)
  console.log(`   - Conferences: http://localhost:${info.port}${API_PREFIX}/conferences`)
  console.log(`   - Participations: http://localhost:${info.port}${API_PREFIX}/participations`)
  console.log(`🌍 Environment: ${NODE_ENV}`)
  console.log(`🔧 CORS Origins: ${CORS_ORIGINS.join(', ')}`)
})
