import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'

const scientists = new OpenAPIHono()

const ScientistSchema = z.object({
  id: z.number().int().positive(),
  fullName: z.string(),
  country: z.string(),
  degree: z.string(),
  specialization: z.string(),
  organization: z.string(),
  email: z.string().email().nullable(),
  orcid: z.string().nullable(),
  hIndex: z.number().int().nonnegative()
}).openapi('Scientist')

const CreateScientistSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  country: z.string().min(1, 'Country is required'),
  degree: z.string().min(1, 'Degree is required'),
  specialization: z.string().min(1, 'Specialization is required'),
  organization: z.string().min(1, 'Organization is required'),
  email: z.string().email().optional(),
  orcid: z.string().optional(),
  hIndex: z.number().int().nonnegative().optional()
}).openapi('CreateScientist')

const UpdateScientistSchema = CreateScientistSchema.partial().openapi('UpdateScientist')

const PaginationSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  total: z.number().int().positive(),
  pages: z.number().int().positive()
}).openapi('Pagination')

const ScientistsResponseSchema = z.object({
  data: z.array(ScientistSchema),
  pagination: PaginationSchema
}).openapi('ScientistsResponse')

const ErrorSchema = z.object({
  error: z.string()
}).openapi('Error')

const getScientistsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Scientists'],
  summary: 'Get all scientists',
  description: 'Returns list of scientists with pagination, sorting and search support',
  request: {
    query: z.object({
      page: z.string().optional().default('1').openapi({ description: 'Page number' }),
      limit: z.string().optional().default('10').openapi({ description: 'Items per page' }),
      sortBy: z.string().optional().default('id').openapi({ description: 'Field to sort by' }),
      sortOrder: z.enum(['asc', 'desc']).optional().default('asc').openapi({ description: 'Sort order' }),
      search: z.string().optional().openapi({ description: 'Search in fullName, specialization, organization' })
    })
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: ScientistsResponseSchema
        }
      },
      description: 'Scientists list retrieved successfully'
    }
  }
})

scientists.openapi(getScientistsRoute, async (c) => {
  const { page, limit, sortBy, sortOrder, search } = c.req.valid('query')
  
  const pageNum = parseInt(page)
  const limitNum = parseInt(limit)
  const skip = (pageNum - 1) * limitNum

  const where = search ? {
    OR: [
      { fullName: { contains: search, mode: 'insensitive' as const } },
      { specialization: { contains: search, mode: 'insensitive' as const } },
      { organization: { contains: search, mode: 'insensitive' as const } }
    ]
  } : {}

  const [data, total] = await Promise.all([
    prisma.scientist.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { [sortBy]: sortOrder }
    }),
    prisma.scientist.count({ where })
  ])

  return c.json({
    data,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }
  })
})

const getScientistRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['Scientists'],
  summary: 'Get scientist by ID',
  request: {
    params: z.object({
      id: z.coerce.number().int().positive().openapi({ description: 'Scientist ID' })
    })
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: ScientistSchema
        }
      },
      description: 'Scientist found'
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'Scientist not found'
    }
  }
})

scientists.openapi(getScientistRoute, async (c) => {
  const { id } = c.req.valid('param')
  
  const scientist = await prisma.scientist.findUnique({
    where: { id }
  })

  if (!scientist) {
    return c.json({ error: 'Scientist not found' }, 404)
  }

  return c.json(scientist, 200)
})

const createScientistRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Scientists'],
  summary: 'Create new scientist',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateScientistSchema
        }
      }
    }
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: ScientistSchema
        }
      },
      description: 'Scientist created successfully'
    }
  }
})

scientists.openapi(createScientistRoute, async (c) => {
  const data = c.req.valid('json')
  
  const scientist = await prisma.scientist.create({
    data
  })

  return c.json(scientist, 201)
})

const updateScientistRoute = createRoute({
  method: 'put',
  path: '/{id}',
  tags: ['Scientists'],
  summary: 'Update scientist',
  request: {
    params: z.object({
      id: z.coerce.number().int().positive()
    }),
    body: {
      content: {
        'application/json': {
          schema: UpdateScientistSchema
        }
      }
    }
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: ScientistSchema
        }
      },
      description: 'Scientist updated'
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'Scientist not found'
    }
  }
})

scientists.openapi(updateScientistRoute, async (c) => {
  const { id } = c.req.valid('param')
  const data = c.req.valid('json')

  try {
    const scientist = await prisma.scientist.update({
      where: { id },
      data
    })

    return c.json(scientist, 200)
  } catch (error) {
    return c.json({ error: 'Scientist not found' }, 404)
  }
})

const deleteScientistRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['Scientists'],
  summary: 'Delete scientist',
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
      description: 'Scientist deleted'
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      },
      description: 'Scientist not found'
    }
  }
})

scientists.openapi(deleteScientistRoute, async (c) => {
  const { id } = c.req.valid('param')

  try {
    await prisma.scientist.delete({
      where: { id }
    })

    return c.json({ message: 'Scientist deleted successfully' }, 200)
  } catch (error) {
    return c.json({ error: 'Scientist not found' }, 404)
  }
})

export default scientists