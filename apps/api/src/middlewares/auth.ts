import type { FastifyRequest, FastifyReply } from 'fastify'
import { auth } from '../lib/firebase'

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      uid: string
      email?: string
    }
  }
}

export async function verifyFirebaseAuth(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ message: 'Unauthorized: Missing token' })
    }

    const token = authHeader.split(' ')[1]
    const decodedToken = await auth.verifyIdToken(token)
    
    request.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
    }
  } catch (error) {
    return reply.status(401).send({ message: 'Unauthorized: Invalid token' })
  }
}
