import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '../lib/firebase'
import { ClientError } from '../errors/client-error'
import { env } from '../env'

export async function confirmParticipants(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/participants/:participantId/confirm',
    {
      schema: {
        params: z.object({
          participantId: z.string().min(1),
        }),
      },
    },
    async (request, reply) => {
      const { participantId } = request.params

      const participantRef = db.collection('participants').doc(participantId)
      const participantDoc = await participantRef.get()

      if (!participantDoc.exists) {
        throw new ClientError('Participant not found.')
      }

      const participantData = participantDoc.data()!

      if (participantData.is_confirmed) {
        return reply.redirect(`${env.WEB_BASE_URL}/trips/${participantData.trip_id}`)
      }

      await participantRef.update({ is_confirmed: true })

      return reply.redirect(`${env.WEB_BASE_URL}/trips/${participantData.trip_id}`)
    },
  )
}
