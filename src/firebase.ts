import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, type User, signOut } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore targeting the specific applet database ID
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId || undefined);

// Initialize Messaging (fail-safe for environments without push notification capabilities)
export let messaging: any = null;

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  isSupported().then((supported) => {
    if (supported) {
      messaging = getMessaging(app);
    } else {
      console.warn('Firebase Cloud Messaging is not supported in this browser context.');
    }
  }).catch((err) => {
    console.error('Error checking FCM support:', err);
  });
}

// Request FCM Device token and register with server
export const requestFCMToken = async (userId: string = 'guest'): Promise<string | null> => {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('HTML5 Notifications are not supported in this browser environment.');
      return null;
    }

    const supported = await isSupported();
    if (!supported) {
      console.warn('FCM is not supported in this browser session.');
      return null;
    }

    if (!messaging) {
      messaging = getMessaging(app);
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission was denied by the user.');
      return null;
    }

    // Wait for the Service Worker to be registered and ready
    let registration = await navigator.serviceWorker.getRegistration('/');
    if (!registration) {
      registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    }
    
    // Attempt to retrieve token
    const token = await getToken(messaging, {
      serviceWorkerRegistration: registration,
      vapidKey: ((import.meta as any).env.VITE_FIREBASE_VAPID_KEY as string) || undefined
    });

    if (token) {
      // Send token to our server
      await fetch('/api/fcm/register-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, token })
      });
      return token;
    } else {
      console.warn('FCM token retrieval returned empty.');
      return null;
    }
  } catch (error: any) {
    console.error('Error registering FCM push token:', error);
    return null;
  }
};

// Configure Google Auth Provider with Calendar and Profile Scopes
export const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/calendar.events');
provider.addScope('https://www.googleapis.com/auth/userinfo.email');
provider.addScope('https://www.googleapis.com/auth/userinfo.profile');

// Local in-memory cache for Google Access Token (for Calendar API requests)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Initialize auth state listener.
export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (onAuthSuccess) {
        onAuthSuccess(user, cachedAccessToken);
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Sign in using Google Auth popup
export const googleSignIn = async (): Promise<{ user: User; accessToken: string | null } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    cachedAccessToken = credential?.accessToken || null;
    
    // Store access token in session state or in-memory
    if (cachedAccessToken) {
      sessionStorage.setItem('google_cal_token', cachedAccessToken);
    }
    
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Retrieve current access token (checks in-memory first, then sessionStorage)
export const getAccessToken = (): string | null => {
  if (cachedAccessToken) return cachedAccessToken;
  return sessionStorage.getItem('google_cal_token');
};

// Clear google access token when unauthorized/expired
export const clearAccessToken = () => {
  cachedAccessToken = null;
  sessionStorage.removeItem('google_cal_token');
};

// Sign out function
export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  sessionStorage.removeItem('google_cal_token');
};

// Validate firestore connection as recommended in the skill
export const testFirestoreConnection = async () => {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firestore connected successfully!');
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('offline')) {
      console.warn('Firestore is offline or connection failed. Using local fallback capabilities.');
    }
  }
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
