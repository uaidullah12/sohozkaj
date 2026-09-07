import { SignJWT, jwtVerify } from 'jose'

const SECRET = process.env.JWT_SECRET || 'dev_secret_change'
const encoder = new TextEncoder()

export async function sign(payload: any){
  const alg = 'HS256'
  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg })
    .setExpirationTime('7d')
    .sign(encoder.encode(SECRET))
  return jwt
}

export async function verify(token: string){
  const { payload } = await jwtVerify(token, encoder.encode(SECRET))
  return payload
}
