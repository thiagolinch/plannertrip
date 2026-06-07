import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import nodemailer from 'nodemailer'
import path from 'path'
import { z } from 'zod'
import { db } from '../lib/firebase'
import { dayjs } from '../lib/dayjs'
import { getMailClient } from '../lib/mail'
import { ClientError } from '../errors/client-error'
import { env } from '../env'
import { buildEmailTemplate } from '../lib/email-template'

export async function confirmTrip(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/trips/:tripId/confirm',
    {
      schema: {
        params: z.object({
          tripId: z.string().min(1),
        }),
      },
    },
    async (request, reply) => {
      const { tripId } = request.params

      const tripRef = db.collection('trips').doc(tripId)
      const tripDoc = await tripRef.get()

      if (!tripDoc.exists) {
        throw new ClientError('Trip not found.')
      }

      const tripData = tripDoc.data()!
      
      // Load participants from flat collection
      const participantsSnapshot = await db
        .collection('participants')
        .where('trip_id', '==', tripId)
        .get()

      const participants = participantsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }))

      // Owner verification is done via the database record status
      const owner = participants.find(p => p.is_owner)

      if (!owner) {
        throw new ClientError('Trip owner not found.')
      }

      if (tripData.is_confirmed) {
        return reply.redirect(`${env.WEB_BASE_URL}/trips/${tripId}`)
      }

      await tripRef.update({ is_confirmed: true })

      const formattedStartDate = dayjs(tripData.starts_at).format('LL')

      const mail = await getMailClient()
      const guests = participants.filter(p => !p.is_owner)

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

          const message = await mail.sendMail({
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
     
          console.log(nodemailer.getTestMessageUrl(message))
        })
      )

      return reply.redirect(`${env.WEB_BASE_URL}/trips/${tripId}`)
    },
  )
}
