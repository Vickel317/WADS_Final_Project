import { getApps, initializeApp, cert, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

type FirebaseAdminConfig = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};

function getFirebaseAdminConfig(): FirebaseAdminConfig | null {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !rawPrivateKey) {
    return null;
  }

  return {
    projectId,
    clientEmail,
    privateKey: rawPrivateKey.replace(/\\n/g, "\n"),
  };
}

let appInstance: App | null = null;

function getFirebaseAdminApp() {
  if (appInstance) {
    return appInstance;
  }

  const config = getFirebaseAdminConfig();
  if (!config) {
    return null;
  }

  if (getApps().length > 0) {
    appInstance = getApps()[0] as App;
    return appInstance;
  }

  appInstance = initializeApp({
    credential: cert({
      projectId: config.projectId,
      clientEmail: config.clientEmail,
      privateKey: config.privateKey,
    }),
  });

  return appInstance;
}

export async function verifyFirebaseIdToken(idToken: string) {
  const app = getFirebaseAdminApp();
  if (!app) {
    return null;
  }

  return getAuth(app).verifyIdToken(idToken);
}

export async function verifyFirebaseSessionCookie(sessionCookie: string) {
  const app = getFirebaseAdminApp();
  if (!app) {
    return null;
  }

  return getAuth(app).verifySessionCookie(sessionCookie, true);
}
