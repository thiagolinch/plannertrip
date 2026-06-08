import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '../lib/firebase'
import { ClientError } from '../errors/client-error'
import { verifyFirebaseAuth } from '../middlewares/auth'

export async function deleteParticipant(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().delete(
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

      const participantRef = db.collection('participants').doc(participantId)
      const participantDoc = await participantRef.get()

      if (!participantDoc.exists) {
        throw new ClientError('Participant not found.')
      }

      const participantData = participantDoc.data()!

      if (participantData.is_owner) {
        throw new ClientError('Cannot delete the trip organizer.')
      }

      // Check if user is the owner (organizer) of this trip
      const ownerSnapshot = await db
        .collection('participants')
        .where('trip_id', '==', participantData.trip_id)
        .where('email', '==', userEmail)
        .where('is_owner', '==', true)
        .get()

      if (ownerSnapshot.empty) {
        throw new ClientError('Access denied: Only the organizer can remove guests.')
      }

      await participantRef.delete()

      return { success: true }
    },
  )
}
