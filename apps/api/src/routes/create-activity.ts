import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '../lib/firebase'
import { dayjs } from '../lib/dayjs'
import { ClientError } from '../errors/client-error'
import { verifyFirebaseAuth } from '../middlewares/auth'

export async function createActivity(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/trips/:tripId/activities',
    {
      preHandler: [verifyFirebaseAuth],
      schema: {
        params: z.object({
          tripId: z.string().uuid(),
        }),
        body: z.object({
          title: z.string().min(4),
          occurs_at: z.coerce.date(),
        }),
      },
    },
    async (request) => {
      const { tripId } = request.params
      const { title, occurs_at } = request.body

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

      if (dayjs(occurs_at).isBefore(tripData.starts_at)) {
        throw new ClientError('Invalid activity date: occurs before trip starts.')
      }

      if (dayjs(occurs_at).isAfter(tripData.ends_at)) {
        throw new ClientError('Invalid activity date: occurs after trip ends.')
      }

      const activityRef = db.collection('activities').doc()
      await activityRef.set({
        trip_id: tripId,
        title,
        occurs_at: occurs_at.toISOString(),
      })

      return { activityId: activityRef.id }
    },
  )
}
