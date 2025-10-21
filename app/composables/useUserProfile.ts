import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { useFirebaseUser } from "@/composables/useFirebaseUser";
import type { FirebasePlugin } from "@/plugins/firebase.client";

type UserRole = "admin" | "client" | null;

export const useUserProfile = () => {
  const role = useState<UserRole>("userRole", () => null);
  const profileReady = useState<boolean>("userProfileReady", () => false);
  return { role, profileReady };
};

export const resetUserProfile = () => {
  const { role, profileReady } = useUserProfile();
  role.value = null;
  profileReady.value = false;
};

const emailMatchesAdmin = (email: string | null | undefined, adminList: string[]): boolean => {
  if (!email) return false;
  return adminList.includes(email.trim().toLowerCase());
};

export const ensureUserProfile = async (options?: { force?: boolean }) => {
  const { role, profileReady } = useUserProfile();
  if (profileReady.value && !options?.force) {
    return;
  }
  if (options?.force) {
    profileReady.value = false;
  }

  const nuxtApp = useNuxtApp();
  const firebase = nuxtApp.$firebase as FirebasePlugin | null | undefined;
  const { user } = useFirebaseUser();

  if (!firebase?.db || !user.value) {
    role.value = null;
    profileReady.value = true;
    return;
  }

  const config = useRuntimeConfig();
  const adminEmailsRaw = String(config.public.adminEmails ?? "");
  const adminEmails = adminEmailsRaw
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  let resolvedRole: "admin" | "client" = emailMatchesAdmin(
    user.value.email,
    adminEmails
  )
    ? "admin"
    : "client";

  try {
    const userRef = doc(firebase.db, "users", user.value.uid);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
      await setDoc(userRef, {
        uid: user.value.uid,
        role: resolvedRole,
        email: user.value.email ?? null,
        displayName: user.value.displayName ?? null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      const data = snapshot.data() as Record<string, unknown>;
      const storedRole =
        data.role === "admin" || data.role === "client" ? data.role : null;

      if (storedRole) {
        resolvedRole = storedRole;
      } else if (resolvedRole === "admin") {
        await updateDoc(userRef, {
          role: resolvedRole,
          updatedAt: serverTimestamp(),
        });
      }

      const updates: Record<string, unknown> = {};
      if (
        user.value.displayName &&
        user.value.displayName !== data.displayName
      ) {
        updates.displayName = user.value.displayName;
      }
      if (user.value.email && user.value.email !== data.email) {
        updates.email = user.value.email;
      }
      if (Object.keys(updates).length > 0) {
        updates.updatedAt = serverTimestamp();
        await updateDoc(userRef, updates);
      }
    }

    role.value = resolvedRole;
  } catch (error) {
    console.error("[profile] failed to resolve user profile:", error);
    role.value = resolvedRole ?? "client";
  } finally {
    profileReady.value = true;
  }
};
