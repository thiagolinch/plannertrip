import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { db } from '../lib/firebase'
import { ClientError } from '../errors/client-error'
import { verifyFirebaseAuth } from '../middlewares/auth'

export async function getTrips(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/trips',
    {
      preHandler: [verifyFirebaseAuth],
    },
    async (request) => {
      const userEmail = request.user?.email
      if (!userEmail) {
        throw new ClientError('Authentication email is required.')
      }

      // Query participants where email matches userEmail
      const participantsSnapshot = await db
        .collection('participants')
        .where('email', '==', userEmail)
        .get()

      const userParticipants = participantsSnapshot.docs.map(doc => doc.data())
      const tripIds = userParticipants.map(p => p.trip_id)

      if (tripIds.length === 0) {
        return { trips: [] }
      }

      // Fetch all trips in parallel
      const tripsPromises = userParticipants.map(async (p) => {
        const tripDoc = await db.collection('trips').doc(p.trip_id).get()
        if (tripDoc.exists) {
          const tripData = tripDoc.data()!
          return {
            id: tripDoc.id,
            destination: tripData.destination,
            starts_at: tripData.starts_at,
            ends_at: tripData.ends_at,
            is_confirmed: tripData.is_confirmed,
            is_owner: p.is_owner || false,
            user_confirmed: p.is_confirmed || false,
          }
        }
        return null
      })

      const trips = (await Promise.all(tripsPromises)).filter(t => t !== null)

      // Sort trips chronologically by starts_at
      trips.sort((a, b) => new Date(a!.starts_at).getTime() - new Date(b!.starts_at).getTime())

      return { trips }
    },
  )
}
