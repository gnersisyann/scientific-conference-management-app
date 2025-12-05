import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'

const conferences = new OpenAPIHono()

const ConferenceSchema = z.object({
  id: z.number().int().positive(),
  topic: z.string(),
  name: z.string(),
  date: z.string().datetime(),
  country: z.string(),
  location: z.string()
}).openapi('Conference')

const ConferenceWithParticipationsSchema = ConferenceSchema.extend({
  participations: z.array(z.any())
}).openapi('ConferenceWithParticipations')

const CreateConferenceSchema = z.object({
  topic: z.string().min(1, 'Topic is required'),
  name: z.string().min(1, 'Name is required'), 
  date: z.string().datetime('Invalid datetime format'),
  country: z.string().min(1, 'Country is required'),
  location: z.string().min(1, 'Location is required')
}).openapi('CreateConference')

const UpdateConferenceSchema = CreateConferenceSchema.partial().openapi('UpdateConference')

const PaginationSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  total: z.number().int().positive(),
  pages: z.number().int().positive()
}).openapi('Pagination')

const ConferencesResponseSchema = z.object({
  data: z.array(ConferenceSchema),
  pagination: PaginationSchema
}).openapi('ConferencesResponse')

const ErrorSchema = z.object({
  error: z.string()
}).openapi('Error')

const getConferencesRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Conferences'],
  summary: 'Get all conferences',
  description: 'Returns list of conferences with pagination, sorting and filtering support',
  request: {
    query: z.object({
      page: z.string().optional().default('1').openapi({ description: 'Page number' }),
      limit: z.string().optional().default('10').openapi({ description: 'Items per page' }),
      sortBy: z.string().optional().default('date').openapi({ description: 'Field to sort by' }),
      sortOrder: z.enum(['asc', 'desc']).optional().default('desc').openapi({ description: 'Sort order' }),
      country: z.string().optional().openapi({ description: 'Filter by country' }),
      topic: z.string().optional().openapi({ description: 'Filter by topic' })
    })
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: ConferencesResponseSchema
        }
      },
      description: 'Conferences list retrieved successfully'
    }
  }
})

conferences.openapi(getConferencesRoute, async (c) => {
  const { page, limit, sortBy, sortOrder, country, topic } = c.req.valid('query')
  
  const pageNum = parseInt(page)
  const limitNum = parseInt(limit)
  const skip = (pageNum - 1) * limitNum

  const where: any = {}
  if (country) where.country = { contains: country, mode: 'insensitive' }
  if (topic) where.topic = { contains: topic, mode: 'insensitive' }

  const [conferences, total] = await Promise.all([
    prisma.conference.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { [sortBy]: sortOrder },
      include: {
        participations: {
          include: {
            scientist: true
          }
        }
      }
    }),
    prisma.conference.count({ where })
  ])

  return c.json({
    data: conferences,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }
  })
})

const getConferenceRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['Conferences'],
  summary: 'Get conference by ID',
  request: {
    params: z.object({
      id: z.coerce.number().int().positive()
    })
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: ConferenceWithParticipationsSchema
        }
      },
      description: 'Conference found'
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'Conference not found'
    }
  }
})

conferences.openapi(getConferenceRoute, async (c) => {
  const { id } = c.req.valid('param')
  
  const conference = await prisma.conference.findUnique({
    where: { id },
    include: {
      participations: {
        include: {
          scientist: true
        }
      }
    }
  })

  if (!conference) {
    return c.json({ error: 'Conference not found' }, 404)
  }

  return c.json(conference, 200)
})

const createConferenceRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Conferences'],
  summary: 'Create new conference',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateConferenceSchema
        }
      }
    }
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: ConferenceSchema
        }
      },
      description: 'Conference created successfully'
    }
  }
})

conferences.openapi(createConferenceRoute, async (c) => {
  const data = c.req.valid('json')
  
  const conference = await prisma.conference.create({
    data: {
      ...data,
      date: new Date(data.date)
    }
  })

  return c.json(conference, 201)
})

const updateConferenceRoute = createRoute({
  method: 'put',
  path: '/{id}',
  tags: ['Conferences'],
  summary: 'Update conference',
  request: {
    params: z.object({
      id: z.coerce.number().int().positive()
    }),
    body: {
      content: {
        'application/json': {
          schema: UpdateConferenceSchema
        }
      }
    }
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: ConferenceSchema
        }
      },
      description: 'Conference updated'
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'Conference not found'
    }
  }
})

conferences.openapi(updateConferenceRoute, async (c) => {
  const { id } = c.req.valid('param')
  const data = c.req.valid('json')

  try {
    const conference = await prisma.conference.update({
      where: { id },
      data: {
        ...data,
        ...(data.date && { date: new Date(data.date) })
      }
    })

    return c.json(conference, 200)
  } catch (error) {
    return c.json({ error: 'Conference not found' }, 404)
  }
})

const deleteConferenceRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['Conferences'],
  summary: 'Delete conference',
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
      description: 'Conference deleted'
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'Conference not found'
    }
  }
})

conferences.openapi(deleteConferenceRoute, async (c) => {
  const { id } = c.req.valid('param')

  try {
    await prisma.conference.delete({
      where: { id }
    })

    return c.json({ message: 'Conference deleted successfully' }, 200)
  } catch (error) {
    return c.json({ error: 'Conference not found' }, 404)
  }
})

export default conferences
