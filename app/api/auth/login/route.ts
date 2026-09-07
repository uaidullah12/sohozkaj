import prismaClient from '../../lib/prisma'
import { compare } from 'bcryptjs'
import { sign } from '../../lib/jwt'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const data = await request.json()
  const { identifier, password } = data
  if(!identifier || !password) return NextResponse.json({error:'Invalid'}, {status:400})

  const user = await prismaClient.user.findFirst({ where: { OR: [{ email: identifier }, { phone: identifier }] } })
  if(!user) return NextResponse.json({error:'Invalid credentials'}, {status:401})

  const ok = await compare(password, user.password)
  if(!ok) return NextResponse.json({error:'Invalid credentials'}, {status:401})

  const token = await sign({ userId: user.id })
  const res = NextResponse.json({ok:true})
  res.cookies.set('sohoz_token', token, { httpOnly: true, path: '/' })
  return res
}
