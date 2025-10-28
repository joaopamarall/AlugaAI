import {
  get,
  ref as dbRef,
  set,
  update,
} from "firebase/database";
import type { User } from "firebase/auth";
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

const emailMatchesAdmin = (
  email: string | null | undefined,
  adminList: string[]
): boolean => {
  if (!email) return false;
  return adminList.includes(email.trim().toLowerCase());
};

type EnsureOptions = {
  force?: boolean;
  authUser?: User | null;
};

export const ensureUserProfile = async (options?: EnsureOptions) => {
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
  const authUser = options?.authUser ?? user.value;

  if (!firebase?.database || !authUser) {
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

  const defaultIsAdmin = emailMatchesAdmin(authUser.email, adminEmails);
  let resolvedRole: UserRole = defaultIsAdmin ? "admin" : "client";

  try {
    const userRef = dbRef(firebase.database, `users/${authUser.uid}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      const nowIso = new Date().toISOString();
      await set(userRef, {
        uid: authUser.uid,
        role: resolvedRole,
        email: authUser.email ?? null,
        displayName: authUser.displayName ?? null,
        isAdmin: defaultIsAdmin,
        createdAt: nowIso,
        updatedAt: nowIso,
      });
    } else {
      const data = snapshot.val() as Record<string, unknown>;
      const updates: Record<string, unknown> = {};

      const storedIsAdmin =
        typeof data.isAdmin === "boolean" ? data.isAdmin : defaultIsAdmin;

      if (typeof storedIsAdmin === "boolean") {
        resolvedRole = storedIsAdmin ? "admin" : "client";
        if (data.isAdmin !== storedIsAdmin) {
          updates.isAdmin = storedIsAdmin;
        }
      }

      if (data.role !== resolvedRole) {
        updates.role = resolvedRole;
      }

      if (
        authUser.displayName &&
        authUser.displayName !== data.displayName
      ) {
        updates.displayName = authUser.displayName;
      }
      if (authUser.email && authUser.email !== data.email) {
        updates.email = authUser.email;
      }
      if (Object.keys(updates).length > 0) {
        updates.updatedAt = new Date().toISOString();
        await update(userRef, updates);
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

