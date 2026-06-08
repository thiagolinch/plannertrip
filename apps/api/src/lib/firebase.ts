import admin from 'firebase-admin'

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID?.replace(/^"(.*)"$/, '$1')
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.replace(/^"(.*)"$/, '$1')
  let privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/^"(.*)"$/, '$1')

  if (projectId && clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      })
    })
  } else {
    // Fallback: Initialize using current environment settings or dummy project ID (e.g. for Firestore emulator)
    admin.initializeApp({
      projectId: projectId || 'planner-trip-local'
    })
  }
}

export const db = admin.firestore()
export const auth = admin.auth()
