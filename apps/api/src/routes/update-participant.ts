import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import nodemailer from 'nodemailer'
import path from 'path'
import { db } from '../lib/firebase'
import { ClientError } from '../errors/client-error'
import { verifyFirebaseAuth } from '../middlewares/auth'
import { getMailClient } from '../lib/mail'
import { buildEmailTemplate } from '../lib/email-template'
import { dayjs } from '../lib/dayjs'
import { env } from '../env'

export async function updateParticipant(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().patch(
    '/participants/:participantId',
    {
      preHandler: [verifyFirebaseAuth],
      schema: {
        params: z.object({
          participantId: z.string().min(1),
        }),
        body: z.object({
          email: z.string().email(),
        }),
      },
    },
    async (request) => {
      const { participantId } = request.params
      const { email } = request.body
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

      if (participantData.is_owner) {
        throw new ClientError('Cannot update the trip organizer.')
      }

      // Check if user is the owner (organizer) of this trip
      const ownerSnapshot = await db
        .collection('participants')
        .where('trip_id', '==', participantData.trip_id)
        .where('email', '==', userEmail)
        .where('is_owner', '==', true)
        .get()

      if (ownerSnapshot.empty) {
        throw new ClientError('Access denied: Only the organizer can modify guests.')
      }

      // Check for duplicate emails in this trip
      const duplicateSnapshot = await db
        .collection('participants')
        .where('trip_id', '==', participantData.trip_id)
        .where('email', '==', email)
        .get()

      const duplicateDocs = duplicateSnapshot.docs.filter(doc => doc.id !== participantId)
      if (duplicateDocs.length > 0) {
        throw new ClientError('A participant with this email has already been invited to this trip.')
      }

      const emailChanged = participantData.email !== email

      await participantRef.update({
        email,
        is_confirmed: false, // Reset confirmation on email change
      })

      // If the email changed and the trip is already confirmed, send a new confirmation email
      if (emailChanged) {
        const tripRef = db.collection('trips').doc(participantData.trip_id)
        const tripDoc = await tripRef.get()
        if (tripDoc.exists && tripDoc.data()!.is_confirmed) {
          const tripData = tripDoc.data()!
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
      }

      return { success: true }
    },
  )
}
