import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import path from 'path'
import { db } from '../lib/firebase'
import { ClientError } from '../errors/client-error'
import { verifyFirebaseAuth } from '../middlewares/auth'
import { getMailClient } from '../lib/mail'
import { buildEmailTemplate } from '../lib/email-template'
import { dayjs } from '../lib/dayjs'
import { env } from '../env'

export async function confirmTripApi(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().patch(
    '/trips/:tripId/confirm',
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

      const tripData = tripDoc.data()!

      // Load participants to verify ownership
      const participantsSnapshot = await db
        .collection('participants')
        .where('trip_id', '==', tripId)
        .get()

      const participants = participantsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }))
      const owner = participants.find(p => p.is_owner)

      if (!owner || owner.email !== userEmail) {
        throw new ClientError('Access denied: Only the owner can confirm this trip.')
      }

      if (tripData.is_confirmed) {
        return { success: true }
      }

      // Confirm the trip
      await tripRef.update({ is_confirmed: true })

      // Send emails to guests
      const formattedStartDate = dayjs(tripData.starts_at).format('LL')
      const formattedEndDate = dayjs(tripData.ends_at).format('LL')
      const mail = await getMailClient()
      const guests = participants.filter(p => !p.is_owner && !p.is_confirmed)

      await Promise.all(
        guests.map(async (participant) => {
          const confirmationLink = `${env.API_BASE_URL}/participants/${participant.id}/confirm`

          const html = buildEmailTemplate({
            destination: tripData.destination,
            startsAt: tripData.starts_at,
            endsAt: tripData.ends_at,
            title: 'Confirmar presença na viagem',
            bodyHtml: `
              Você foi convidado(a) para participar de uma viagem para <strong class="highlight">${tripData.destination}</strong> nas datas de <strong class="highlight">${dayjs(tripData.starts_at).format('LL')}</strong> até <strong class="highlight">${dayjs(tripData.ends_at).format('LL')}</strong>.
              <p style="margin-top: 16px;">Para confirmar sua presença e ver todos os detalhes da viagem, clique no botão abaixo:</p>
            `,
            buttonText: 'Confirmar presença',
            buttonLink: confirmationLink
          })

          await mail.sendMail({
            from: {
              name: 'Equipe plann.er',
              address: env.MAIL_FROM || 'oi@plann.er',
            },
            to: participant.email,
            subject: `Confirme sua presença na viagem para ${tripData.destination} em ${formattedStartDate}`,
            html,
            attachments: [
              {
                filename: 'logo.svg',
                path: path.resolve(__dirname, '../assets/logo.svg'),
                cid: 'logo'
              }
            ]
          })
        })
      )

      return { success: true }
    },
  )
}
