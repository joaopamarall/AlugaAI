import { useFirebaseUser, waitForAuthReady } from "@/composables/useFirebaseUser";

export default defineNuxtRouteMiddleware(async (to) => {
  if (process.server) return;

  const PROTECTED = ["/home"];
  const needsAuth = PROTECTED.some((path) => to.path.startsWith(path));
  if (!needsAuth) return;

  const nuxtApp = useNuxtApp();
  const firebase = nuxtApp.$firebase;

  if (!firebase?.auth) {
    console.warn(
      "[auth] Firebase não configurado. Redirecionando para a página de login."
    );
    return navigateTo("/");
  }

  await waitForAuthReady();
  const { user } = useFirebaseUser();

  if (!user.value) {
    return navigateTo("/");
  }
});
