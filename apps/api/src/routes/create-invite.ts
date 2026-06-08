import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { randomUUID } from 'crypto'
import path from 'path'
import { z } from 'zod'
import nodemailer from 'nodemailer'
import { db } from '../lib/firebase'
import { dayjs } from '../lib/dayjs'
import { getMailClient } from '../lib/mail'
import { ClientError } from '../errors/client-error'
import { env } from '../env'
import { buildEmailTemplate } from '../lib/email-template'
import { verifyFirebaseAuth } from '../middlewares/auth'

export async function createInvite(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/trips/:tripId/invites',
    {
      preHandler: [verifyFirebaseAuth],
      schema: {
        params: z.object({
          tripId: z.string().min(1),
        }),
        body: z.object({
          email: z.string().email(),
        }),
      },
    },
    async (request) => {
      const { tripId } = request.params
      const { email } = request.body

      const userEmail = request.user?.email
      if (!userEmail) {
        throw new ClientError('Authentication email is required.')
      }

      const tripRef = db.collection('trips').doc(tripId)
      const tripDoc = await tripRef.get()

      if (!tripDoc.exists) {
        throw new ClientError('Trip not found')
      }

      // Check if user is the owner (organizer) of this trip
      const participantsSnapshot = await db
        .collection('participants')
        .where('trip_id', '==', tripId)
        .where('email', '==', userEmail)
        .where('is_owner', '==', true)
        .get()

      if (participantsSnapshot.empty) {
        throw new ClientError('Access denied: Only the organizer can invite guests to this trip.')
      }

      const tripData = tripDoc.data()!

      // Check if participant is already invited
      const existingParticipant = await db
        .collection('participants')
        .where('trip_id', '==', tripId)
        .where('email', '==', email)
        .get()

      if (!existingParticipant.empty) {
        throw new ClientError('This email has already been invited to this trip.')
      }

      // Add guest to flat participants collection
      const participantId = randomUUID()
      const participantRef = db.collection('participants').doc(participantId)

      await participantRef.set({
        trip_id: tripId,
        name: null,
        email,
        is_owner: false,
        is_confirmed: false,
      })

      // Send email only if the trip is confirmed
      if (tripData.is_confirmed) {
        const formattedStartDate = dayjs(tripData.starts_at).format('LL')
        const mail = await getMailClient()
        const confirmationLink = `${env.API_BASE_URL}/participants/${participantId}/confirm`

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

        const message = await mail.sendMail({
          from: {
            name: 'Equipe plann.er',
            address: env.MAIL_FROM || 'oi@plann.er',
          },
          to: email,
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

        console.log(nodemailer.getTestMessageUrl(message))
      }

      return { participantId }
    },
  )
}
