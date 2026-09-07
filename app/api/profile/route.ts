import prismaClient from '../../lib/prisma'
import { NextResponse } from 'next/server'
import { verify } from '../../lib/jwt'

export async function GET(request: Request){
  const cookie = request.headers.get('cookie') || ''
  const match = cookie.match(/sohoz_token=([^;]+)/)
  if(!match) return NextResponse.json({user:null})
  try{
    const payload = await verify(match[1])
    const user = await prismaClient.user.findUnique({ where: { id: payload.userId }, include: { profile: true } })
    return NextResponse.json({user})
  }catch(e){
    return NextResponse.json({user:null})
  }
}
