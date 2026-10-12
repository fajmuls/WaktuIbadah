import { initializeApp } from 'firebase/app';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export const app = initializeApp(firebaseConfig);

export const db = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId || '(default)');

export const auth = getAuth(app);
