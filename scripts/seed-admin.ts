import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { hashSync } from 'bcryptjs'
import * as schema from '../src/lib/db/schema'

require('dotenv').config({ path: '.env.local' })

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql, { schema })

async function seed() {
  console.log('Seeding admin user...')

  const [company] = await db
    .insert(schema.companies)
    .values({
      name: 'HandwerkOS Demo',
      slug: 'handwerkos-demo',
      email: 'admin@handwerkos.de',
      addressCountry: 'DE',
    })
    .returning()

  console.log('Company created:', company.id)

  const [user] = await db
    .insert(schema.users)
    .values({
      companyId: company.id,
      role: 'admin',
      firstName: 'Marcel',
      lastName: 'Admin',
      email: 'admin@handwerkos.de',
      passwordHash: hashSync('admin123456', 12),
      isActive: true,
    })
    .returning()

  console.log('Admin user created:', user.email)
  console.log('Login with:')
  console.log('  Email:    admin@handwerkos.de')
  console.log('  Password: admin123456')
}

seed().catch(console.error)
