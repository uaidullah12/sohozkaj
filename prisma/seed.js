// Seed script
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main(){
  const pass = await bcrypt.hash('password123',10)
  const user = await prisma.user.upsert({
    where: { email: 'admin@sohozkaj.test' },
    update: {},
    create: { email: 'admin@sohozkaj.test', password: pass, role: 'ADMIN' }
  })
  console.log('Seeded', user.email)
}

main().catch(e=>{console.error(e);process.exit(1)})
