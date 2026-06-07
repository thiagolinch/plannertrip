import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '../lib/firebase'
import { ClientError } from '../errors/client-error'
import { verifyFirebaseAuth } from '../middlewares/auth'

export async function getParticipant(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/participants/:participantId',
    {
      preHandler: [verifyFirebaseAuth],
      schema: {
        params: z.object({
          participantId: z.string().min(1),
        }),
      },
    },
    async (request) => {
      const { participantId } = request.params

      const userEmail = request.user?.email
      if (!userEmail) {
        throw new ClientError('Authentication email is required.')
      }

      const participantDoc = await db.collection('participants').doc(participantId).get()

      if (!participantDoc.exists) {
        throw new ClientError('Participant not found')
      }

      const participantData = participantDoc.data()!
      const tripId = participantData.trip_id

      // Verify the authenticated user is a participant in the same trip
      const requesterSnapshot = await db
        .collection('participants')
        .where('trip_id', '==', tripId)
        .where('email', '==', userEmail)
        .get()

      if (requesterSnapshot.empty) {
        throw new ClientError('Access denied: You are not a participant in this trip.')
      }

      return {
        participant: {
          id: participantDoc.id,
          name: participantData.name,
          email: participantData.email,
          is_confirmed: participantData.is_confirmed,
        }
      }
    },
  )
}
