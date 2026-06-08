import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '../lib/firebase'
import { dayjs } from '../lib/dayjs'
import { ClientError } from '../errors/client-error'
import { verifyFirebaseAuth } from '../middlewares/auth'

export async function updateActivity(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().patch(
    '/activities/:activityId',
    {
      preHandler: [verifyFirebaseAuth],
      schema: {
        params: z.object({
          activityId: z.string().min(1),
        }),
        body: z.object({
          title: z.string().min(4).optional(),
          occurs_at: z.coerce.date().optional(),
          local: z.string().optional().nullable(),
        }),
      },
    },
    async (request) => {
      const { activityId } = request.params
      const { title, occurs_at, local } = request.body
      const userEmail = request.user?.email

      if (!userEmail) {
        throw new ClientError('Authentication email is required.')
      }

      const activityRef = db.collection('activities').doc(activityId)
      const activityDoc = await activityRef.get()

      if (!activityDoc.exists) {
        throw new ClientError('Activity not found.')
      }

      const activityData = activityDoc.data()!

      // Check if user is a participant of this trip
      const participantsSnapshot = await db
        .collection('participants')
        .where('trip_id', '==', activityData.trip_id)
        .where('email', '==', userEmail)
        .get()

      if (participantsSnapshot.empty) {
        throw new ClientError('Access denied: You are not invited to this trip.')
      }

      const updateData: any = {}

      if (title !== undefined) {
        updateData.title = title
      }

      if (local !== undefined) {
        updateData.local = local
      }

      if (occurs_at !== undefined) {
        const tripRef = db.collection('trips').doc(activityData.trip_id)
        const tripDoc = await tripRef.get()

        if (!tripDoc.exists) {
          throw new ClientError('Trip not found')
        }

        const tripData = tripDoc.data()!

        if (dayjs.utc(occurs_at).isBefore(dayjs.utc(tripData.starts_at).startOf('day'))) {
          throw new ClientError('Invalid activity date: occurs before trip starts.')
        }

        if (dayjs.utc(occurs_at).isAfter(dayjs.utc(tripData.ends_at).endOf('day'))) {
          throw new ClientError('Invalid activity date: occurs after trip ends.')
        }

        updateData.occurs_at = occurs_at.toISOString()
      }

      if (Object.keys(updateData).length > 0) {
        await activityRef.update(updateData)
      }

      return { success: true }
    },
  )
}
