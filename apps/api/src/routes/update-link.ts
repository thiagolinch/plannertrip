import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '../lib/firebase'
import { ClientError } from '../errors/client-error'
import { verifyFirebaseAuth } from '../middlewares/auth'

export async function updateLink(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().patch(
    '/links/:linkId',
    {
      preHandler: [verifyFirebaseAuth],
      schema: {
        params: z.object({
          linkId: z.string().min(1),
        }),
        body: z.object({
          title: z.string().min(4).optional(),
          url: z.string().url().optional(),
        }),
      },
    },
    async (request) => {
      const { linkId } = request.params
      const { title, url } = request.body

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

      // Check if user is a participant of this trip
      const participantsSnapshot = await db
        .collection('participants')
        .where('trip_id', '==', linkData.trip_id)
        .where('email', '==', userEmail)
        .get()

      if (participantsSnapshot.empty) {
        throw new ClientError('Access denied: You are not invited to this trip.')
      }

      const updateData: any = {}

      if (title !== undefined) {
        updateData.title = title
      }

      if (url !== undefined) {
        updateData.url = url
      }

      if (Object.keys(updateData).length > 0) {
        await linkRef.update(updateData)
      }

      return { success: true }
    },
  )
}
