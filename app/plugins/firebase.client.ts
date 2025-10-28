import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type Auth,
  type User,
} from "firebase/auth";
import { getDatabase, type Database } from "firebase/database";
import { getStorage, type FirebaseStorage } from "firebase/storage";

export type FirebasePlugin = {
  app: FirebaseApp;
  auth: Auth;
  database: Database;
  storage: FirebaseStorage;
  signInWithGoogle: () => Promise<void>;
  signOutFirebase: () => Promise<void>;
};

export default defineNuxtPlugin((_nuxtApp) => {

  const config = useRuntimeConfig();
  const firebaseConfig = {
    apiKey: config.public.firebaseApiKey,
    authDomain: config.public.firebaseAuthDomain,
    projectId: config.public.firebaseProjectId,
    storageBucket: config.public.firebaseStorageBucket,
    messagingSenderId: config.public.firebaseMessagingSenderId,
    appId: config.public.firebaseAppId,
    measurementId: config.public.firebaseMeasurementId,
    databaseURL: config.public.firebaseDatabaseUrl,
  };

  const currentUser = useState<User | null>("firebaseUser", () => null);
  const authReady = useState<boolean>("firebaseAuthReady", () => false);
  const listenerAttached = useState<boolean>(
    "firebaseAuthListenerAttached",
    () => false
  );

  const hasMinimalConfig =
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId &&
    firebaseConfig.databaseURL;

  if (!hasMinimalConfig) {
    console.warn(
      "[firebase] Variaveis de ambiente do Firebase nao configuradas. O login ficara inoperante."
    );
    authReady.value = true;
    return {
      provide: {
        firebase: null as FirebasePlugin | null,
        firebaseAuthReady: authReady,
      },
    };
  }

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

  const auth = getAuth(app);
  auth.useDeviceLanguage();
  currentUser.value = auth.currentUser;

  if (!listenerAttached.value) {
    onAuthStateChanged(
      auth,
      (user) => {
        currentUser.value = user;
        authReady.value = true;
      },
      (error) => {
        console.error("[firebase] onAuthStateChanged error:", error);
        currentUser.value = null;
        authReady.value = true;
      }
    );
    listenerAttached.value = true;
  } else if (!authReady.value) {
    currentUser.value = auth.currentUser;
    authReady.value = true;
  }

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    await signInWithPopup(auth, provider);
  };

  const signOutFirebase = async () => {
    await signOut(auth);
  };

  const payload: FirebasePlugin = {
    app,
    auth,
    database: getDatabase(app),
    storage: getStorage(app),
    signInWithGoogle,
    signOutFirebase,
  };

  return {
    provide: {
      firebase: payload,
      firebaseAuthReady: authReady,
    },
  };
});


