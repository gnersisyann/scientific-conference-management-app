import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'

const participations = new OpenAPIHono()

const ParticipationSchema = z.object({
  id: z.number().int().positive(),
  talkTitle: z.string(),
  participationType: z.string(),
  durationMinutes: z.number().int().positive(),
  scientistId: z.number().int().positive(),
  conferenceId: z.number().int().positive(),
  status: z.string(),
  metadata: z.record(z.string(), z.any()).nullable()
}).openapi('Participation')

const CreateParticipationSchema = z.object({
  talkTitle: z.string().min(1, 'Talk title is required'),
  participationType: z.string().min(1, 'Participation type is required'),
  durationMinutes: z.number().min(1, 'Duration must be at least 1 minute'),
  scientistId: z.number().int().positive('Valid scientist ID required'),
  conferenceId: z.number().int().positive('Valid conference ID required'),
  status: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional()
}).openapi('CreateParticipation')

const UpdateParticipationSchema = CreateParticipationSchema.partial().openapi('UpdateParticipation')

const PaginationSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  total: z.number().int().positive(),
  pages: z.number().int().positive()
}).openapi('Pagination')

const ParticipationsResponseSchema = z.object({
  data: z.array(ParticipationSchema),
  pagination: PaginationSchema
}).openapi('ParticipationsResponse')

const SearchResultSchema = z.object({
  data: z.array(z.any()),
  pagination: z.object({
    page: z.number(),
    limit: z.number()
  })
}).openapi('SearchResult')

const ErrorSchema = z.object({
  error: z.string()
}).openapi('Error')

function formatParticipation(p: any) {
  return {
    id: p.id,
    talkTitle: p.talkTitle,
    participationType: p.participationType,
    durationMinutes: p.durationMinutes,
    scientistId: p.scientistId,
    conferenceId: p.conferenceId,
    status: p.status,
    metadata: typeof p.metadata === 'object' ? p.metadata : null
  }
}

const getParticipationsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Participations'],
  summary: 'Get all participations',
  description: 'Returns list of participations with pagination and filtering support',
  request: {
    query: z.object({
      page: z.string().optional().default('1').openapi({ description: 'Page number' }),
      limit: z.string().optional().default('10').openapi({ description: 'Items per page' }),
      sortBy: z.string().optional().default('id').openapi({ description: 'Field to sort by' }),
      sortOrder: z.enum(['asc', 'desc']).optional().default('asc').openapi({ description: 'Sort order' }),
      participationType: z.string().optional().openapi({ description: 'Filter by participation type' }),
      status: z.string().optional().openapi({ description: 'Filter by status' }),
      scientistId: z.string().optional().openapi({ description: 'Filter by scientist ID' }),
      conferenceId: z.string().optional().openapi({ description: 'Filter by conference ID' })
    })
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: ParticipationsResponseSchema
        }
      },
      description: 'Participations list retrieved successfully'
    }
  }
})

participations.openapi(getParticipationsRoute, async (c) => {
  const { page, limit, sortBy, sortOrder, participationType, status, scientistId, conferenceId } = c.req.valid('query')
  
  const pageNum = parseInt(page)
  const limitNum = parseInt(limit)
  const skip = (pageNum - 1) * limitNum

  const where: any = {}
  if (participationType) where.participationType = { contains: participationType, mode: 'insensitive' }
  if (status) where.status = { contains: status, mode: 'insensitive' }
  if (scientistId) where.scientistId = parseInt(scientistId)
  if (conferenceId) where.conferenceId = parseInt(conferenceId)

  const [data, total] = await Promise.all([
    prisma.participation.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { [sortBy]: sortOrder }
    }),
    prisma.participation.count({ where })
  ])

  return c.json({
    data: data.map(formatParticipation),
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }
  })
})

const getParticipationRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['Participations'],
  summary: 'Get participation by ID',
  request: {
    params: z.object({
      id: z.coerce.number().int().positive().openapi({ description: 'Participation ID' })
    })
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: ParticipationSchema
        }
      },
      description: 'Participation found'
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'Participation not found'
    }
  }
})

participations.openapi(getParticipationRoute, async (c) => {
  const { id } = c.req.valid('param')
  
  const participation = await prisma.participation.findUnique({
    where: { id }
  })

  if (!participation) {
    return c.json({ error: 'Participation not found' }, 404)
  }

  return c.json(formatParticipation(participation), 200)
})

const createParticipationRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Participations'],
  summary: 'Create new participation',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateParticipationSchema
        }
      }
    }
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: ParticipationSchema
        }
      },
      description: 'Participation created successfully'
    },
    400: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'Invalid data or scientist/conference not found'
    }
  }
})

participations.openapi(createParticipationRoute, async (c) => {
  const data = c.req.valid('json')
  
  try {
    const participation = await prisma.participation.create({
      data: {
        talkTitle: data.talkTitle,
        participationType: data.participationType,
        durationMinutes: data.durationMinutes,
        scientistId: data.scientistId,
        conferenceId: data.conferenceId,
        status: data.status || 'confirmed',
        metadata: data.metadata
      }
    })

    return c.json(formatParticipation(participation), 201)
  } catch (error) {
    return c.json({ error: 'Failed to create participation. Check if scientist and conference exist.' }, 400)
  }
})

const updateParticipationRoute = createRoute({
  method: 'put',
  path: '/{id}',
  tags: ['Participations'],
  summary: 'Update participation',
  request: {
    params: z.object({
      id: z.coerce.number().int().positive()
    }),
    body: {
      content: {
        'application/json': {
          schema: UpdateParticipationSchema
        }
      }
    }
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: ParticipationSchema
        }
      },
      description: 'Participation updated'
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'Participation not found'
    }
  }
})

participations.openapi(updateParticipationRoute, async (c) => {
  const { id } = c.req.valid('param')
  const data = c.req.valid('json')

  try {
    const participation = await prisma.participation.update({
      where: { id },
      data
    })

    return c.json(formatParticipation(participation), 200)
  } catch (error) {
    return c.json({ error: 'Participation not found' }, 404)
  }
})

const deleteParticipationRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['Participations'],
  summary: 'Delete participation',
  request: {
    params: z.object({
      id: z.coerce.number().int().positive()
    })
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({ message: z.string() })
        }
      },
      description: 'Participation deleted'
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'Participation not found'
    }
  }
})

participations.openapi(deleteParticipationRoute, async (c) => {
  const { id } = c.req.valid('param')

  try {
    await prisma.participation.delete({
      where: { id }
    })

    return c.json({ message: 'Participation deleted successfully' }, 200)
  } catch (error) {
    return c.json({ error: 'Participation not found' }, 404)
  }
})

const searchParticipationsRoute = createRoute({
  method: 'get',
  path: '/search',
  tags: ['Participations'],
  summary: 'Search participations by metadata',
  description: 'Fulltext search in JSON metadata using PostgreSQL regex',
  request: {
    query: z.object({
      q: z.string().min(1).openapi({ description: 'Search query for metadata field' }),
      page: z.string().optional().default('1').openapi({ description: 'Page number' }),
      limit: z.string().optional().default('10').openapi({ description: 'Items per page' })
    })
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: SearchResultSchema
        }
      },
      description: 'Search results'
    }
  }
})

participations.openapi(searchParticipationsRoute, async (c) => {
  const { q: query, page, limit } = c.req.valid('query')
  
  const pageNum = parseInt(page)
  const limitNum = parseInt(limit)
  const skip = (pageNum - 1) * limitNum

  const results = await prisma.$queryRaw<Array<any>>`
    SELECT p.*, 
           s."fullName" as "scientistName",
           c."name" as "conferenceName"
    FROM "Participation" p
    JOIN "Scientist" s ON p."scientistId" = s.id
    JOIN "Conference" c ON p."conferenceId" = c.id
    WHERE p.metadata::text ~* ${query}
    ORDER BY p.id
    LIMIT ${limitNum} OFFSET ${skip}
  `

  return c.json({
    data: results || [],
    pagination: {
      page: pageNum,
      limit: limitNum
    }
  })
})

export default participations