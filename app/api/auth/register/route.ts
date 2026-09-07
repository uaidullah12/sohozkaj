import prismaClient from '../../lib/prisma'
import { hash } from 'bcryptjs'
import { sign } from '../../lib/jwt'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const data = await request.json()
  const { name, email, password } = data
  if(!email || !password) return NextResponse.json({error:'Invalid'}, {status:400})

  const existing = await prismaClient.user.findUnique({ where: { email } })
  if(existing) return NextResponse.json({error:'User exists'}, {status:409})

  const hashed = await hash(password, 10)
  const user = await prismaClient.user.create({ data: { email, password: hashed } })
  await prismaClient.profile.create({ data: { userId: user.id, name } })
  const token = await sign({ userId: user.id })
  const res = NextResponse.json({ok:true})
  res.cookies.set('sohoz_token', token, { httpOnly: true, path: '/' })
  return res
}
