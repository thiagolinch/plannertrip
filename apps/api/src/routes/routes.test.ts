import { vi, describe, it, expect, beforeEach } from 'vitest'
import { buildApp } from '../app'
import { randomUUID } from 'crypto'

// Create in-memory mock data store to simulate Firestore
let mockTripsStore: any[] = []
let mockParticipantsStore: any[] = []
let mockActivitiesStore: any[] = []
let mockLinksStore: any[] = []

vi.mock('../lib/mail', () => {
  return {
    getMailClient: async () => {
      return {
        sendMail: async (options: any) => {
          return {
            messageId: 'mock-message-id'
          }
        }
      }
    }
  }
})

vi.mock('../lib/firebase', () => {
  return {
    db: {
      batch: () => {
        const batchDeletes: any[] = []
        return {
          delete: (docRef: any) => {
            batchDeletes.push(docRef)
          },
          commit: async () => {
            for (const docRef of batchDeletes) {
              const targetId = docRef.id
              const col = docRef.colName
              if (col === 'trips') {
                mockTripsStore = mockTripsStore.filter(t => t.id !== targetId)
              } else if (col === 'participants') {
                mockParticipantsStore = mockParticipantsStore.filter(p => p.id !== targetId)
              } else if (col === 'activities') {
                mockActivitiesStore = mockActivitiesStore.filter(a => a.id !== targetId)
              } else if (col === 'links') {
                mockLinksStore = mockLinksStore.filter(l => l.id !== targetId)
              }
            }
          }
        }
      },
      collection: (colName: string) => {
        const createQuery = (filters: Array<{ field: string; val: any }> = []) => {
          return {
            where: (field: string, op: string, val: any) => {
              return createQuery([...filters, { field, val }])
            },
            get: async () => {
              let filtered: any[] = []
              if (colName === 'trips') {
                filtered = mockTripsStore
              } else if (colName === 'participants') {
                filtered = mockParticipantsStore
              } else if (colName === 'activities') {
                filtered = mockActivitiesStore
              } else if (colName === 'links') {
                filtered = mockLinksStore
              }

              for (const f of filters) {
                filtered = filtered.filter(item => item[f.field] === f.val)
              }

              return {
                empty: filtered.length === 0,
                docs: filtered.map(d => ({
                  id: d.id,
                  ref: { id: d.id, colName },
                  data: () => d
                }))
              }
            }
          }
        }

        return {
          doc: (docId?: string) => {
            const id = docId || randomUUID()
            const docRef = { id, colName }
            return {
              id,
              colName,
              ref: docRef,
              get: async () => {
                let data: any = null
                if (colName === 'trips') {
                  data = mockTripsStore.find(t => t.id === id)
                } else if (colName === 'participants') {
                  data = mockParticipantsStore.find(p => p.id === id)
                }
                return {
                  exists: !!data,
                  data: () => data
                }
              },
              set: async (data: any) => {
                const docWithId = { id, ...data }
                if (colName === 'trips') {
                  mockTripsStore.push(docWithId)
                } else if (colName === 'participants') {
                  mockParticipantsStore.push(docWithId)
                } else if (colName === 'activities') {
                  mockActivitiesStore.push(docWithId)
                } else if (colName === 'links') {
                  mockLinksStore.push(docWithId)
                }
              },
              update: async (data: any) => {
                let doc: any = null
                if (colName === 'trips') {
                  doc = mockTripsStore.find(t => t.id === id)
                } else if (colName === 'participants') {
                  doc = mockParticipantsStore.find(p => p.id === id)
                }
                if (doc) {
                  Object.assign(doc, data)
                }
              }
            }
          },
          where: (field: string, op: string, val: any) => {
            return createQuery().where(field, op, val)
          }
        }
      }
    },
    auth: {
      verifyIdToken: async (token: string) => {
        if (token === 'valid-token') {
          return {
            uid: 'user-uid-123',
            email: 'john@example.com'
          }
        }
        throw new Error('Invalid token')
      }
    }
  }
})

const app = buildApp()

beforeEach(() => {
  mockTripsStore = []
  mockParticipantsStore = []
  mockActivitiesStore = []
  mockLinksStore = []
})

describe('Trip Routes', () => {
  it('should successfully create a trip when authenticated', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/trips',
      headers: {
        authorization: 'Bearer valid-token'
      },
      payload: {
        destination: 'Florianópolis, SC',
        starts_at: new Date(Date.now() + 86400000).toISOString(),
        ends_at: new Date(Date.now() + 86400000 * 5).toISOString(),
        owner_name: 'John Doe',
        emails_to_invite: ['friend@example.com']
      }
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body).toHaveProperty('tripId')
    expect(mockTripsStore).toHaveLength(1)
    expect(mockParticipantsStore).toHaveLength(2)
  })

  it('should fail creating a trip if unauthenticated', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/trips',
      payload: {
        destination: 'Florianópolis, SC',
        starts_at: new Date(Date.now() + 86400000).toISOString(),
        ends_at: new Date(Date.now() + 86400000 * 5).toISOString(),
        owner_name: 'John Doe',
        emails_to_invite: ['friend@example.com']
      }
    })

    expect(response.statusCode).toBe(401)
  })

  it('should fail creating a trip if start date is in the past', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/trips',
      headers: {
        authorization: 'Bearer valid-token'
      },
      payload: {
        destination: 'Florianópolis, SC',
        starts_at: new Date(Date.now() - 86400000).toISOString(),
        ends_at: new Date(Date.now() + 86400000 * 5).toISOString(),
        owner_name: 'John Doe',
        emails_to_invite: ['friend@example.com']
      }
    })

    expect(response.statusCode).toBe(400)
    const body = JSON.parse(response.body)
    expect(body.message).toContain('Invalid trip start date')
  })

  it('should fail creating a trip if end date is before start date', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/trips',
      headers: {
        authorization: 'Bearer valid-token'
      },
      payload: {
        destination: 'Florianópolis, SC',
        starts_at: new Date(Date.now() + 86400000).toISOString(),
        ends_at: new Date(Date.now() + 40000).toISOString(), // starts_at is tomorrow, ends_at is today + 40s
        owner_name: 'John Doe',
        emails_to_invite: ['friend@example.com']
      }
    })

    expect(response.statusCode).toBe(400)
    const body = JSON.parse(response.body)
    expect(body.message).toContain('Invalid trip end date')
  })

  it('should list user trips', async () => {
    // Setup mock trip
    const tripId = randomUUID()
    mockTripsStore.push({
      id: tripId,
      destination: 'Florianópolis, SC',
      starts_at: new Date(Date.now() + 86400000).toISOString(),
      ends_at: new Date(Date.now() + 86400000 * 5).toISOString(),
      is_confirmed: true
    })
    mockParticipantsStore.push({
      trip_id: tripId,
      name: 'John Doe',
      email: 'john@example.com',
      is_owner: true,
      is_confirmed: true
    })

    const response = await app.inject({
      method: 'GET',
      url: '/trips',
      headers: {
        authorization: 'Bearer valid-token'
      }
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.trips).toHaveLength(1)
    expect(body.trips[0].destination).toBe('Florianópolis, SC')
  })

  it('should fail listing user trips if unauthenticated', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/trips'
    })

    expect(response.statusCode).toBe(401)
  })

  it('should get details for a trip if user is invited', async () => {
    const tripId = randomUUID()
    mockTripsStore.push({
      id: tripId,
      destination: 'Florianópolis, SC',
      starts_at: new Date(Date.now() + 86400000).toISOString(),
      ends_at: new Date(Date.now() + 86400000 * 5).toISOString(),
      is_confirmed: true
    })
    mockParticipantsStore.push({
      trip_id: tripId,
      name: 'John Doe',
      email: 'john@example.com',
      is_owner: true,
      is_confirmed: true
    })

    const response = await app.inject({
      method: 'GET',
      url: `/trips/${tripId}`,
      headers: {
        authorization: 'Bearer valid-token'
      }
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.trip.destination).toBe('Florianópolis, SC')
  })

  it('should fail getting details for a trip if user is not invited', async () => {
    const tripId = randomUUID()
    mockTripsStore.push({
      id: tripId,
      destination: 'Florianópolis, SC',
      starts_at: new Date(Date.now() + 86400000).toISOString(),
      ends_at: new Date(Date.now() + 86400000 * 5).toISOString(),
      is_confirmed: true
    })

    const response = await app.inject({
      method: 'GET',
      url: `/trips/${tripId}`,
      headers: {
        authorization: 'Bearer valid-token'
      }
    })

    expect(response.statusCode).toBe(400)
    const body = JSON.parse(response.body)
    expect(body.message).toContain('Access denied')
  })

  it('should fail getting details for a trip if trip does not exist', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/trips/non-existent-trip-id`,
      headers: {
        authorization: 'Bearer valid-token'
      }
    })

    expect(response.statusCode).toBe(400)
    const body = JSON.parse(response.body)
    expect(body.message).toContain('Trip not found')
  })

  it('should update trip details successfully if user is invited', async () => {
    const tripId = randomUUID()
    mockTripsStore.push({
      id: tripId,
      destination: 'Florianópolis, SC',
      starts_at: new Date(Date.now() + 86400000).toISOString(),
      ends_at: new Date(Date.now() + 86400000 * 5).toISOString(),
      is_confirmed: true
    })
    mockParticipantsStore.push({
      trip_id: tripId,
      name: 'John Doe',
      email: 'john@example.com',
      is_owner: true,
      is_confirmed: true
    })

    const response = await app.inject({
      method: 'PUT',
      url: `/trips/${tripId}`,
      headers: {
        authorization: 'Bearer valid-token'
      },
      payload: {
        destination: 'Beto Carrero, SC',
        starts_at: new Date(Date.now() + 86400000 * 2).toISOString(),
        ends_at: new Date(Date.now() + 86400000 * 6).toISOString()
      }
    })

    expect(response.statusCode).toBe(200)
    expect(mockTripsStore[0].destination).toBe('Beto Carrero, SC')
  })

  it('should fail updating trip details if user is not invited', async () => {
    const tripId = randomUUID()
    mockTripsStore.push({
      id: tripId,
      destination: 'Florianópolis, SC',
      starts_at: new Date(Date.now() + 86400000).toISOString(),
      ends_at: new Date(Date.now() + 86400000 * 5).toISOString(),
      is_confirmed: true
    })

    const response = await app.inject({
      method: 'PUT',
      url: `/trips/${tripId}`,
      headers: {
        authorization: 'Bearer valid-token'
      },
      payload: {
        destination: 'Beto Carrero, SC',
        starts_at: new Date(Date.now() + 86400000 * 2).toISOString(),
        ends_at: new Date(Date.now() + 86400000 * 6).toISOString()
      }
    })

    expect(response.statusCode).toBe(400)
    const body = JSON.parse(response.body)
    expect(body.message).toContain('Access denied')
  })

  it('should confirm trip, update status and redirect to web app', async () => {
    const tripId = randomUUID()
    mockTripsStore.push({
      id: tripId,
      destination: 'Florianópolis, SC',
      starts_at: new Date(Date.now() + 86400000).toISOString(),
      ends_at: new Date(Date.now() + 86400000 * 5).toISOString(),
      is_confirmed: false
    })
    mockParticipantsStore.push({
      trip_id: tripId,
      name: 'John Doe',
      email: 'john@example.com',
      is_owner: true,
      is_confirmed: true
    })
    mockParticipantsStore.push({
      trip_id: tripId,
      name: 'Friend',
      email: 'friend@example.com',
      is_owner: false,
      is_confirmed: false
    })

    const response = await app.inject({
      method: 'GET',
      url: `/trips/${tripId}/confirm`
    })

    expect(response.statusCode).toBe(302) // Redirect status code
    expect(mockTripsStore[0].is_confirmed).toBe(true)
  })

  it('should successfully confirm a trip via PATCH endpoint when owner is authenticated', async () => {
    const tripId = randomUUID()
    mockTripsStore.push({
      id: tripId,
      destination: 'Florianópolis, SC',
      starts_at: new Date(Date.now() + 86400000).toISOString(),
      ends_at: new Date(Date.now() + 86400000 * 5).toISOString(),
      is_confirmed: false
    })
    mockParticipantsStore.push({
      trip_id: tripId,
      name: 'John Doe',
      email: 'john@example.com',
      is_owner: true,
      is_confirmed: true
    })
    mockParticipantsStore.push({
      trip_id: tripId,
      name: 'Friend',
      email: 'friend@example.com',
      is_owner: false,
      is_confirmed: false
    })

    const response = await app.inject({
      method: 'PATCH',
      url: `/trips/${tripId}/confirm`,
      headers: {
        authorization: 'Bearer valid-token'
      }
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.success).toBe(true)
    expect(mockTripsStore[0].is_confirmed).toBe(true)
  })

  it('should fail to confirm a trip via PATCH endpoint if user is not the owner', async () => {
    const tripId = randomUUID()
    mockTripsStore.push({
      id: tripId,
      destination: 'Florianópolis, SC',
      starts_at: new Date(Date.now() + 86400000).toISOString(),
      ends_at: new Date(Date.now() + 86400000 * 5).toISOString(),
      is_confirmed: false
    })
    mockParticipantsStore.push({
      trip_id: tripId,
      name: 'John Doe',
      email: 'otherowner@example.com',
      is_owner: true,
      is_confirmed: true
    })

    const response = await app.inject({
      method: 'PATCH',
      url: `/trips/${tripId}/confirm`,
      headers: {
        authorization: 'Bearer valid-token'
      }
    })

    expect(response.statusCode).toBe(400)
    const body = JSON.parse(response.body)
    expect(body.message).toContain('Access denied')
  })

  it('should fail to confirm a trip via PATCH endpoint if unauthenticated', async () => {
    const tripId = randomUUID()
    const response = await app.inject({
      method: 'PATCH',
      url: `/trips/${tripId}/confirm`
    })

    expect(response.statusCode).toBe(401)
  })

  it('should fail to confirm a trip via PATCH endpoint if trip does not exist', async () => {
    const tripId = randomUUID()
    const response = await app.inject({
      method: 'PATCH',
      url: `/trips/${tripId}/confirm`,
      headers: {
        authorization: 'Bearer valid-token'
      }
    })

    expect(response.statusCode).toBe(400)
    const body = JSON.parse(response.body)
    expect(body.message).toContain('Trip not found')
  })

  it('should successfully delete a trip when owner is authenticated', async () => {
    const tripId = randomUUID()
    mockTripsStore.push({
      id: tripId,
      destination: 'Florianópolis, SC',
      starts_at: new Date(Date.now() + 86400000).toISOString(),
      ends_at: new Date(Date.now() + 86400000 * 5).toISOString(),
      is_confirmed: true
    })
    mockParticipantsStore.push({
      trip_id: tripId,
      name: 'John Doe',
      email: 'john@example.com',
      is_owner: true,
      is_confirmed: true
    })

    const response = await app.inject({
      method: 'DELETE',
      url: `/trips/${tripId}`,
      headers: {
        authorization: 'Bearer valid-token'
      }
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.success).toBe(true)
    expect(mockTripsStore.find(t => t.id === tripId)).toBeUndefined()
  })

  it('should fail to delete a trip if user is not the owner', async () => {
    const tripId = randomUUID()
    mockTripsStore.push({
      id: tripId,
      destination: 'Florianópolis, SC',
      starts_at: new Date(Date.now() + 86400000).toISOString(),
      ends_at: new Date(Date.now() + 86400000 * 5).toISOString(),
      is_confirmed: true
    })
    mockParticipantsStore.push({
      trip_id: tripId,
      name: 'John Doe',
      email: 'other@example.com',
      is_owner: true,
      is_confirmed: true
    })

    const response = await app.inject({
      method: 'DELETE',
      url: `/trips/${tripId}`,
      headers: {
        authorization: 'Bearer valid-token'
      }
    })

    expect(response.statusCode).toBe(400)
    const body = JSON.parse(response.body)
    expect(body.message).toContain('Access denied')
  })

  it('should fail to delete a trip if unauthenticated', async () => {
    const tripId = randomUUID()
    const response = await app.inject({
      method: 'DELETE',
      url: `/trips/${tripId}`
    })

    expect(response.statusCode).toBe(401)
  })
})

describe('Activities Routes', () => {
  it('should add activity if user is a trip participant', async () => {
    const tripId = randomUUID()
    const tripStart = new Date(Date.now() + 86400000)
    const tripEnd = new Date(Date.now() + 86400000 * 5)
    
    mockTripsStore.push({
      id: tripId,
      destination: 'Florianópolis, SC',
      starts_at: tripStart.toISOString(),
      ends_at: tripEnd.toISOString(),
      is_confirmed: true
    })
    
    mockParticipantsStore.push({
      trip_id: tripId,
      name: 'John Doe',
      email: 'john@example.com',
      is_owner: true,
      is_confirmed: true
    })

    const response = await app.inject({
      method: 'POST',
      url: `/trips/${tripId}/activities`,
      headers: {
        authorization: 'Bearer valid-token'
      },
      payload: {
        title: 'Academia',
        occurs_at: new Date(tripStart.getTime() + 10000).toISOString()
      }
    })

    expect(response.statusCode).toBe(200)
    expect(mockActivitiesStore).toHaveLength(1)
  })

  it('should fail adding activity if user is not a participant', async () => {
    const tripId = randomUUID()
    const tripStart = new Date(Date.now() + 86400000)
    const tripEnd = new Date(Date.now() + 86400000 * 5)
    
    mockTripsStore.push({
      id: tripId,
      destination: 'Florianópolis, SC',
      starts_at: tripStart.toISOString(),
      ends_at: tripEnd.toISOString(),
      is_confirmed: true
    })

    const response = await app.inject({
      method: 'POST',
      url: `/trips/${tripId}/activities`,
      headers: {
        authorization: 'Bearer valid-token'
      },
      payload: {
        title: 'Academia',
        occurs_at: new Date(tripStart.getTime() + 10000).toISOString()
      }
    })

    expect(response.statusCode).toBe(400)
    const body = JSON.parse(response.body)
    expect(body.message).toContain('Access denied')
  })

  it('should fail adding activity if occurs_at is before trip starts', async () => {
    const tripId = randomUUID()
    const tripStart = new Date(Date.now() + 86400000)
    const tripEnd = new Date(Date.now() + 86400000 * 5)
    
    mockTripsStore.push({
      id: tripId,
      destination: 'Florianópolis, SC',
      starts_at: tripStart.toISOString(),
      ends_at: tripEnd.toISOString(),
      is_confirmed: true
    })
    mockParticipantsStore.push({
      trip_id: tripId,
      name: 'John Doe',
      email: 'john@example.com',
      is_owner: true,
      is_confirmed: true
    })

    const response = await app.inject({
      method: 'POST',
      url: `/trips/${tripId}/activities`,
      headers: {
        authorization: 'Bearer valid-token'
      },
      payload: {
        title: 'Academia',
        occurs_at: new Date(tripStart.getTime() - 10000).toISOString() // before trip starts
      }
    })

    expect(response.statusCode).toBe(400)
    const body = JSON.parse(response.body)
    expect(body.message).toContain('Invalid activity date')
  })

  it('should list activities sorted chronologically and grouped by day', async () => {
    const tripId = randomUUID()
    const tripStart = new Date(Date.now() + 86400000)
    const tripEnd = new Date(Date.now() + 86400000 * 2) // 2 days trip
    
    mockTripsStore.push({
      id: tripId,
      destination: 'Florianópolis, SC',
      starts_at: tripStart.toISOString(),
      ends_at: tripEnd.toISOString(),
      is_confirmed: true
    })
    mockParticipantsStore.push({
      trip_id: tripId,
      name: 'John Doe',
      email: 'john@example.com',
      is_owner: true,
      is_confirmed: true
    })

    // Mock activities
    mockActivitiesStore.push({
      trip_id: tripId,
      title: 'Activity 2',
      occurs_at: new Date(tripStart.getTime() + 7200000).toISOString() // day 1, later
    })
    mockActivitiesStore.push({
      trip_id: tripId,
      title: 'Activity 1',
      occurs_at: new Date(tripStart.getTime() + 3600000).toISOString() // day 1, earlier
    })

    const response = await app.inject({
      method: 'GET',
      url: `/trips/${tripId}/activities`,
      headers: {
        authorization: 'Bearer valid-token'
      }
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.activities).toBeDefined()
    // The first day's activities should be sorted chronologically: Activity 1 then Activity 2
    const day1Activities = body.activities[0].activities
    expect(day1Activities[0].title).toBe('Activity 1')
    expect(day1Activities[1].title).toBe('Activity 2')
  })
})

describe('Participants Routes', () => {
  it('should add invite successfully', async () => {
    const tripId = randomUUID()
    mockTripsStore.push({
      id: tripId,
      destination: 'Florianópolis, SC',
      starts_at: new Date(Date.now() + 86400000).toISOString(),
      ends_at: new Date(Date.now() + 86400000 * 5).toISOString(),
      is_confirmed: true
    })
    
    mockParticipantsStore.push({
      trip_id: tripId,
      name: 'John Doe',
      email: 'john@example.com',
      is_owner: true,
      is_confirmed: true
    })

    const response = await app.inject({
      method: 'POST',
      url: `/trips/${tripId}/invites`,
      headers: {
        authorization: 'Bearer valid-token'
      },
      payload: {
        email: 'friend@example.com'
      }
    })

    expect(response.statusCode).toBe(200)
    expect(mockParticipantsStore).toHaveLength(2)
  })

  it('should fail to add invite if user is not the trip owner', async () => {
    const tripId = randomUUID()
    mockTripsStore.push({
      id: tripId,
      destination: 'Florianópolis, SC',
      starts_at: new Date(Date.now() + 86400000).toISOString(),
      ends_at: new Date(Date.now() + 86400000 * 5).toISOString(),
      is_confirmed: true
    })
    
    mockParticipantsStore.push({
      trip_id: tripId,
      name: 'John Doe',
      email: 'john@example.com',
      is_owner: false,
      is_confirmed: true
    })

    const response = await app.inject({
      method: 'POST',
      url: `/trips/${tripId}/invites`,
      headers: {
        authorization: 'Bearer valid-token'
      },
      payload: {
        email: 'friend@example.com'
      }
    })

    expect(response.statusCode).toBe(400)
    const body = JSON.parse(response.body)
    expect(body.message).toContain('Access denied')
  })

  it('should list participants successfully', async () => {
    const tripId = randomUUID()
    mockTripsStore.push({
      id: tripId,
      destination: 'Florianópolis, SC',
      starts_at: new Date(Date.now() + 86400000).toISOString(),
      ends_at: new Date(Date.now() + 86400000 * 5).toISOString(),
      is_confirmed: true
    })
    mockParticipantsStore.push({
      trip_id: tripId,
      name: 'John Doe',
      email: 'john@example.com',
      is_owner: true,
      is_confirmed: true
    })
    mockParticipantsStore.push({
      trip_id: tripId,
      name: 'Friend',
      email: 'friend@example.com',
      is_owner: false,
      is_confirmed: false
    })

    const response = await app.inject({
      method: 'GET',
      url: `/trips/${tripId}/participants`,
      headers: {
        authorization: 'Bearer valid-token'
      }
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.participants).toHaveLength(2)
  })

  it('should get individual participant details successfully', async () => {
    const tripId = randomUUID()
    const participantId = randomUUID()
    
    mockTripsStore.push({
      id: tripId,
      destination: 'Florianópolis, SC',
      starts_at: new Date(Date.now() + 86400000).toISOString(),
      ends_at: new Date(Date.now() + 86400000 * 5).toISOString(),
      is_confirmed: true
    })
    mockParticipantsStore.push({
      trip_id: tripId,
      name: 'John Doe',
      email: 'john@example.com',
      is_owner: true,
      is_confirmed: true
    })
    mockParticipantsStore.push({
      id: participantId,
      trip_id: tripId,
      name: 'Friend',
      email: 'friend@example.com',
      is_owner: false,
      is_confirmed: false
    })

    const response = await app.inject({
      method: 'GET',
      url: `/participants/${participantId}`,
      headers: {
        authorization: 'Bearer valid-token'
      }
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.participant.email).toBe('friend@example.com')
  })

  it('should confirm participant presence successfully', async () => {
    const tripId = randomUUID()
    const participantId = randomUUID()
    
    mockParticipantsStore.push({
      id: participantId,
      trip_id: tripId,
      name: 'Friend',
      email: 'friend@example.com',
      is_owner: false,
      is_confirmed: false
    })

    const response = await app.inject({
      method: 'GET',
      url: `/participants/${participantId}/confirm`
    })

    expect(response.statusCode).toBe(302) // Redirect
    const updated = mockParticipantsStore.find(p => p.id === participantId)
    expect(updated.is_confirmed).toBe(true)
  })

  it('should confirm presence via PATCH API successfully', async () => {
    const participantId = randomUUID()
    mockParticipantsStore.push({
      id: participantId,
      trip_id: 'trip-123',
      name: 'John Doe',
      email: 'john@example.com',
      is_owner: false,
      is_confirmed: false
    })

    const response = await app.inject({
      method: 'PATCH',
      url: `/participants/${participantId}/confirm`,
      headers: {
        authorization: 'Bearer valid-token'
      }
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.success).toBe(true)
    
    const updated = mockParticipantsStore.find(p => p.id === participantId)
    expect(updated.is_confirmed).toBe(true)
  })

  it('should fail confirming presence via PATCH API if user tries to confirm another participant', async () => {
    const participantId = randomUUID()
    mockParticipantsStore.push({
      id: participantId,
      trip_id: 'trip-123',
      name: 'Friend',
      email: 'friend@example.com',
      is_owner: false,
      is_confirmed: false
    })

    const response = await app.inject({
      method: 'PATCH',
      url: `/participants/${participantId}/confirm`,
      headers: {
        authorization: 'Bearer valid-token'
      }
    })

    expect(response.statusCode).toBe(400)
    const body = JSON.parse(response.body)
    expect(body.message).toContain('Access denied')
  })
})
