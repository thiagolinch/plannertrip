import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '../lib/firebase'
import { dayjs } from '../lib/dayjs'
import { ClientError } from '../errors/client-error'
import { verifyFirebaseAuth } from '../middlewares/auth'

export async function getActivities(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/trips/:tripId/activities',
    {
      preHandler: [verifyFirebaseAuth],
      schema: {
        params: z.object({
          tripId: z.string().uuid(),
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
        throw new ClientError('Trip not found')
      }

      // Check if user is a participant of this trip
      const participantsSnapshot = await db
        .collection('participants')
        .where('trip_id', '==', tripId)
        .where('email', '==', userEmail)
        .get()

      if (participantsSnapshot.empty) {
        throw new ClientError('Access denied: You are not invited to this trip.')
      }

      const tripData = tripDoc.data()!
      
      // Load all activities from flat activities collection
      const activitiesSnapshot = await db
        .collection('activities')
        .where('trip_id', '==', tripId)
        .get()
      
      const activitiesList = activitiesSnapshot.docs.map(doc => ({
        id: doc.id,
        title: doc.data().title,
        occurs_at: doc.data().occurs_at,
      }))

      // Sort activities chronologically by occurs_at
      activitiesList.sort((a, b) => new Date(a.occurs_at).getTime() - new Date(b.occurs_at).getTime())

      const differenceInDaysBetweenTripStartAndEnd = dayjs(tripData.ends_at).diff(tripData.starts_at, 'days')

      const activities = Array.from({ length: differenceInDaysBetweenTripStartAndEnd + 1 }).map((_, index) => {
        const date = dayjs(tripData.starts_at).add(index, 'days')

        return {
          date: date.toDate(),
          activities: activitiesList.filter(activity => {
            return dayjs(activity.occurs_at).isSame(date, 'day')
          })
        }
      })

      return { activities }
    },
  )
}
