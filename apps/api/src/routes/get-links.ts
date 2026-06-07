import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '../lib/firebase'
import { ClientError } from '../errors/client-error'
import { verifyFirebaseAuth } from '../middlewares/auth'

export async function getLinks(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/trips/:tripId/links',
    {
      preHandler: [verifyFirebaseAuth],
      schema: {
        params: z.object({
          tripId: z.string().uuid(),
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

      const linksSnapshot = await db
        .collection('links')
        .where('trip_id', '==', tripId)
        .get()

      const links = linksSnapshot.docs.map(doc => ({
        id: doc.id,
        title: doc.data().title,
        url: doc.data().url,
      }))

      return { links }
    },
  )
}
