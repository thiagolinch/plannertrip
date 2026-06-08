import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '../lib/firebase'
import { ClientError } from '../errors/client-error'
import { verifyFirebaseAuth } from '../middlewares/auth'

export async function deleteLink(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().delete(
    '/links/:linkId',
    {
      preHandler: [verifyFirebaseAuth],
      schema: {
        params: z.object({
          linkId: z.string().min(1),
        }),
      },
    },
    async (request) => {
      const { linkId } = request.params

      const userEmail = request.user?.email
      if (!userEmail) {
        throw new ClientError('Authentication email is required.')
      }

      const linkRef = db.collection('links').doc(linkId)
      const linkDoc = await linkRef.get()

      if (!linkDoc.exists) {
        throw new ClientError('Link not found.')
      }

      const linkData = linkDoc.data()!

      // Check if user is the trip owner
      const participantsSnapshot = await db
        .collection('participants')
        .where('trip_id', '==', linkData.trip_id)
        .where('email', '==', userEmail)
        .get()

      if (participantsSnapshot.empty) {
        throw new ClientError('Access denied: You are not invited to this trip.')
      }

      const participant = participantsSnapshot.docs[0].data()
      if (!participant.is_owner) {
        throw new ClientError('Access denied: Only trip owner can delete links.')
      }

      await linkRef.delete()

      return { success: true }
    },
  )
}
