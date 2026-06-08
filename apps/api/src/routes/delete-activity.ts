import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '../lib/firebase'
import { ClientError } from '../errors/client-error'
import { verifyFirebaseAuth } from '../middlewares/auth'

export async function deleteActivity(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().delete(
    '/activities/:activityId',
    {
      preHandler: [verifyFirebaseAuth],
      schema: {
        params: z.object({
          activityId: z.string().min(1),
        }),
      },
    },
    async (request) => {
      const { activityId } = request.params
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

      // Check if user is the owner (organizer) of this trip
      const ownerSnapshot = await db
        .collection('participants')
        .where('trip_id', '==', activityData.trip_id)
        .where('email', '==', userEmail)
        .where('is_owner', '==', true)
        .get()

      if (ownerSnapshot.empty) {
        throw new ClientError('Access denied: Only the organizer can delete activities.')
      }

      await activityRef.delete()

      return { success: true }
    },
  )
}
