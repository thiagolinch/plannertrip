import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '../lib/firebase'
import { ClientError } from '../errors/client-error'
import { verifyFirebaseAuth } from '../middlewares/auth'

export async function deleteTrip(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().delete(
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
        throw new ClientError('Trip not found.')
      }

      // Load participants to verify ownership
      const participantsSnapshot = await db
        .collection('participants')
        .where('trip_id', '==', tripId)
        .get()

      const participants = participantsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }))
      const owner = participants.find(p => p.is_owner)

      if (!owner || owner.email !== userEmail) {
        throw new ClientError('Access denied: Only the owner can delete this trip.')
      }

      // Batch delete the trip and all its sub-resources
      const batch = db.batch()
      batch.delete(tripRef)

      // Delete participants
      participantsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref)
      })

      // Delete activities
      const activitiesSnapshot = await db
        .collection('activities')
        .where('trip_id', '==', tripId)
        .get()
      activitiesSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref)
      })

      // Delete links
      const linksSnapshot = await db
        .collection('links')
        .where('trip_id', '==', tripId)
        .get()
      linksSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref)
      })

      await batch.commit()

      return { success: true }
    },
  )
}
