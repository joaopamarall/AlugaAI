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

type FirebasePlugin = {
  app: FirebaseApp;
  auth: Auth;
  signInWithGoogle: () => Promise<void>;
  signOutFirebase: () => Promise<void>;
};

export default defineNuxtPlugin((_nuxtApp) => {
  if (process.server) {
    return;
  }

  const config = useRuntimeConfig();
  const firebaseConfig = {
    apiKey: config.public.firebaseApiKey,
    authDomain: config.public.firebaseAuthDomain,
    projectId: config.public.firebaseProjectId,
    storageBucket: config.public.firebaseStorageBucket,
    messagingSenderId: config.public.firebaseMessagingSenderId,
    appId: config.public.firebaseAppId,
    measurementId: config.public.firebaseMeasurementId,
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
    firebaseConfig.appId;

  if (!hasMinimalConfig) {
    console.warn(
      "[firebase] Variáveis de ambiente do Firebase não configuradas. O login ficará inoperante."
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
