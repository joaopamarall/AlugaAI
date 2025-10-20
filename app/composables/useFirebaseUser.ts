import { watch, type Ref } from "vue";
import type { User } from "firebase/auth";

export const useFirebaseUser = (): {
  user: Ref<User | null>;
  authReady: Ref<boolean>;
} => {
  const user = useState<User | null>("firebaseUser", () => null);
  const authReady = useState<boolean>("firebaseAuthReady", () => false);

  return { user, authReady };
};

export const waitForAuthReady = async (): Promise<void> => {
  const { authReady } = useFirebaseUser();
  if (authReady.value) return;

  await new Promise<void>((resolve) => {
    const stop = watch(
      authReady,
      (ready) => {
        if (ready) {
          stop();
          resolve();
        }
      },
      { immediate: true }
    );
  });
};
