import { useFirebaseUser, waitForAuthReady } from "@/composables/useFirebaseUser";
import {
  ensureUserProfile,
  resetUserProfile,
  useUserProfile,
} from "@/composables/useUserProfile";

const ADMIN_PREFIX = "/admin";
const APP_PREFIX = "/app";

export default defineNuxtRouteMiddleware(async (to) => {
  if (process.server) return;

  const needsAuth =
    to.path.startsWith(ADMIN_PREFIX) || to.path.startsWith(APP_PREFIX);
  if (!needsAuth) return;

  const nuxtApp = useNuxtApp();
  const firebase = nuxtApp.$firebase;

  if (!firebase?.auth) {
    console.warn(
      "[auth] Firebase nao configurado. Redirecionando para a pagina de login."
    );
    return navigateTo("/login");
  }

  await waitForAuthReady();
  const { user } = useFirebaseUser();

  if (!user.value) {
    resetUserProfile();
    return navigateTo("/login");
  }

  await ensureUserProfile();
  const { role } = useUserProfile();

  if (to.path.startsWith(ADMIN_PREFIX)) {
    if (role.value !== "admin") {
      return navigateTo("/app/catalog");
    }
    return;
  }

  if (to.path.startsWith(APP_PREFIX)) {
    if (!role.value) {
      return navigateTo("/login");
    }
  }
});
