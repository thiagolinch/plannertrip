import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { randomUUID } from 'crypto'
import path from 'path'
import nodemailer from 'nodemailer'
import { z } from 'zod'
import { db } from '../lib/firebase'
import { getMailClient } from '../lib/mail'
import { dayjs } from '../lib/dayjs'
import { ClientError } from '../errors/client-error'
import { env } from '../env'
import { verifyFirebaseAuth } from '../middlewares/auth'
import { buildEmailTemplate } from '../lib/email-template'

export async function createTrip(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/trips',
    {
      preHandler: [verifyFirebaseAuth],
      schema: {
        body: z.object({
          destination: z.string().min(4),
          starts_at: z.coerce.date(),
          ends_at: z.coerce.date(),
          owner_name: z.string(),
          emails_to_invite: z.array(z.string().email()),
        }),
      },
    },
    async (request) => {
      const {
        destination,
        starts_at,
        ends_at,
        owner_name,
        emails_to_invite,
      } = request.body

      const owner_email = request.user?.email
      if (!owner_email) {
        throw new ClientError('Authenticated user must have an email.')
      }

      if (dayjs(starts_at).isBefore(new Date())) {
        throw new ClientError('Invalid trip start date.')
      }

      if (dayjs(ends_at).isBefore(starts_at)) {
        throw new ClientError('Invalid trip end date.')
      }

      const tripId = randomUUID()
      const tripRef = db.collection('trips').doc(tripId)

      await tripRef.set({
        destination,
        starts_at: starts_at.toISOString(),
        ends_at: ends_at.toISOString(),
        is_confirmed: false,
        created_at: new Date().toISOString(),
      })

      // Add owner to flat participants collection
      const ownerId = randomUUID()
      const ownerRef = db.collection('participants').doc(ownerId)
      await ownerRef.set({
        trip_id: tripId,
        name: owner_name,
        email: owner_email,
        is_owner: true,
        is_confirmed: true,
      })

      // Add guests to flat participants collection
      for (const email of emails_to_invite) {
        const guestId = randomUUID()
        const guestRef = db.collection('participants').doc(guestId)
        await guestRef.set({
          trip_id: tripId,
          name: null,
          email,
          is_owner: false,
          is_confirmed: false,
        })
      }

      const formattedStartDate = dayjs(starts_at).format('LL')
      const confirmationLink = `${env.API_BASE_URL}/trips/${tripId}/confirm`

      const mail = await getMailClient()

      const html = buildEmailTemplate({
        destination,
        startsAt: starts_at,
        endsAt: ends_at,
        title: 'Confirmar criação de viagem',
        bodyHtml: `
          Você solicitou a criação de uma viagem para <strong class="highlight">${destination}</strong> nas datas de <strong class="highlight">${dayjs(starts_at).format('LL')}</strong> até <strong class="highlight">${dayjs(ends_at).format('LL')}</strong>.
          <p style="margin-top: 16px;">Para confirmar sua viagem e disparar os convites para seus amigos, clique no botão abaixo:</p>
        `,
        buttonText: 'Confirmar viagem',
        buttonLink: confirmationLink
      })

      const message = await mail.sendMail({
        from: {
          name: 'Equipe plann.er',
          address: env.MAIL_FROM || 'oi@plann.er',
        },
        to: {
          name: owner_name,
          address: owner_email,
        },
        subject: `Confirme sua viagem para ${destination} em ${formattedStartDate}`,
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

      return { tripId }
    },
  )
}
