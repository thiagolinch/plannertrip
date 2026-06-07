import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '../lib/firebase'
import { ClientError } from '../errors/client-error'
import { verifyFirebaseAuth } from '../middlewares/auth'

export async function confirmParticipantApi(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().patch(
    '/participants/:participantId/confirm',
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

      if (participantData.email !== userEmail) {
        throw new ClientError('Access denied: You can only confirm your own presence.')
      }

      await participantRef.update({ is_confirmed: true })

      return { success: true }
    },
  )
}
