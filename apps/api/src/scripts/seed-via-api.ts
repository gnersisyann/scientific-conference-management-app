import 'dotenv/config'

type ScientistInput = {
  fullName: string
  country: string
  degree: string
  specialization: string
  organization: string
  email?: string
  orcid?: string
  hIndex?: number
}

type ConferenceInput = {
  topic: string
  name: string
  date: string
  country: string
  location: string
  capacity?: number
}

type ParticipationInput = {
  talkTitle: string
  participationType: string
  durationMinutes: number
  scientistId: number
  conferenceId: number
  status?: string
  metadata?: Record<string, unknown>
}

const API_BASE =
  process.env.SEED_API_URL ||
  process.env.SCONF_SEED_API_URL ||
  process.env.NUXT_PUBLIC_API_BASE_URL ||
  `http://localhost:${process.env.SCONF_API_PORT || process.env.PORT || 3000}/api`

async function http<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Request failed ${res.status} ${res.statusText}: ${text}`)
  }

  return res.json() as Promise<T>
}

function pick<T>(list: T[]) {
  return list[Math.floor(Math.random() * list.length)]
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

async function seedScientists(count = 30) {
  const countries = ['USA', 'Germany', 'France', 'UK', 'Canada', 'Japan', 'Australia', 'Spain']
  const degrees = ['PhD', 'Doctor of Sciences', 'Master', 'Professor']
  const specs = ['AI', 'Biology', 'Physics', 'Chemistry', 'Math', 'Data Science', 'Robotics']
  const orgs = ['MIT', 'Stanford', 'Cambridge', 'Oxford', 'ETH Zurich', 'CNRS', 'Max Planck']
  const domains = ['mit.edu', 'stanford.edu', 'cam.ac.uk', 'ox.ac.uk', 'ethz.ch', 'cnrs.fr', 'mpg.de']

  const created: number[] = []
  for (let i = 1; i <= count; i++) {
    const scientist: ScientistInput = {
      fullName: `Dr. Scientist ${i}`,
      country: pick(countries),
      degree: pick(degrees),
      specialization: pick(specs),
      organization: pick(orgs),
      email: `scientist${i}@${pick(domains)}`,
      orcid: `000${i}-000${randomInt(1000, 9999)}-${randomInt(1000, 9999)}-${randomInt(100, 999)}X`,
      hIndex: randomInt(0, 100)
    }

    const s = await http<{ id: number }>('/scientists', scientist)
    created.push(s.id)
  }
  return created
}

async function seedConferences(count = 20) {
  const topics = ['AI', 'Biotech', 'Quantum', 'Climate', 'Space', 'Robotics', 'Health']
  const countries = ['USA', 'Germany', 'France', 'UK', 'Canada', 'Japan', 'Australia', 'Spain']
  const cities = ['Boston', 'Berlin', 'Paris', 'London', 'Toronto', 'Tokyo', 'Sydney', 'Madrid']

  const created: number[] = []
  const today = new Date()

  for (let i = 1; i <= count; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i * 7)

    const conf: ConferenceInput = {
      topic: pick(topics),
      name: `${pick(topics)} Conference ${i}`,
      date: date.toISOString(),
      country: pick(countries),
      location: pick(cities),
      capacity: randomInt(100, 500)
    }

    const c = await http<{ id: number }>('/conferences', conf)
    created.push(c.id)
  }
  return created
}

async function seedParticipations(scientistIds: number[], conferenceIds: number[], count = 60) {
  const types = ['Keynote', 'Workshop', 'Poster', 'Panel']
  const statuses = ['confirmed', 'pending', 'declined', 'completed']
  const titles = [
    'Advances in AI',
    'Future of Robotics',
    'Climate Change Solutions',
    'Quantum Breakthroughs',
    'Biotech Innovations',
    'Space Exploration',
    'Machine Learning Trends',
    'Sustainable Technologies',
    'Quantum Computing Applications',
    'Genetic Engineering Ethics'
  ]

  for (let i = 0; i < count; i++) {
    const participation: ParticipationInput = {
      talkTitle: pick(titles),
      participationType: pick(types),
      durationMinutes: randomInt(15, 90),
      scientistId: pick(scientistIds),
      conferenceId: pick(conferenceIds),
      status: pick(statuses),
      metadata: {
        rating: randomInt(1, 5),
        slidesUrl: `https://example.com/slides/${i + 1}`,
        recordingUrl: `https://example.com/recordings/${i + 1}`,
        tags: [pick(titles), pick(types)],
        attendees: randomInt(10, 200)
      }
    }

    await http('/participations', participation)
  }
}

async function main() {
  console.log(`Seeding via API at ${API_BASE}`)
  
  try {
    const scientists = await seedScientists(30)
    console.log(`✓ Created scientists: ${scientists.length}`)
    
    const conferences = await seedConferences(15)
    console.log(`✓ Created conferences: ${conferences.length}`)
    
    await seedParticipations(scientists, conferences, 80)
    console.log(`✓ Created participations: 80`)
    
    console.log('\nSeeding completed successfully!')
  } catch (err) {
    console.error('✗ Seeding failed:', err)
    process.exit(1)
  }
}

main()