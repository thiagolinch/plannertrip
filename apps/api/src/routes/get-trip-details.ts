import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '../lib/firebase'
import { ClientError } from '../errors/client-error'
import { verifyFirebaseAuth } from '../middlewares/auth'

export async function getTripDetails(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/trips/:tripId',
    {
      preHandler: [verifyFirebaseAuth],
      schema: {
        params: z.object({
          tripId: z.string().min(1),
        }),
      },
    },
    async (request) => {
      const { tripId } = request.params

      const userEmail = request.user?.email
      if (!userEmail) {
        throw new ClientError('Authentication email is required.')
      }

      const tripRef = db.collection('trips').doc(tripId)
      const tripDoc = await tripRef.get()

      if (!tripDoc.exists) {
        throw new ClientError('Trip not found')
      }

      // Check if user is a participant of this trip
      const participantsSnapshot = await db
        .collection('participants')
        .where('trip_id', '==', tripId)
        .where('email', '==', userEmail)
        .get()

      if (participantsSnapshot.empty) {
        throw new ClientError('Access denied: You are not invited to this trip.')
      }

      const tripData = tripDoc.data()!
      const participantDoc = participantsSnapshot.docs[0]
      const participantData = participantDoc.data()!

      return {
        trip: {
          id: tripDoc.id,
          destination: tripData.destination,
          starts_at: tripData.starts_at,
          ends_at: tripData.ends_at,
          is_confirmed: tripData.is_confirmed,
        },
        my_participant: {
          id: participantDoc.id,
          name: participantData.name,
          email: participantData.email,
          is_confirmed: participantData.is_confirmed,
          is_owner: participantData.is_owner || false,
        }
      }
    },
  )
}
