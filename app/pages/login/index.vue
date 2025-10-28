<template>
  <main class="container-app">
    <div class="bg-app"></div>

    <section class="card">
      <header class="grid place-items-center text-center gap-1 mb-6">
        <div class="brand-mark">🛠️</div>
        <h1 class="h1">AlugaAI</h1>
        <p class="muted caption">Acesse sua conta</p>
      </header>

      <form @submit.prevent="submit" class="form" novalidate>
        <div class="field">
          <label class="label">E-mail</label>
          <input
            v-model.trim="email"
            type="email"
            inputmode="email"
            placeholder="voce@email.com"
            autocomplete="email"
            :class="[
              'input',
              showErrors && !validEmail ? 'input--invalid' : '',
            ]"
          />
          <p v-if="showErrors && !validEmail" class="error-inline">
            Informe um e-mail válido.
          </p>
        </div>

        <div class="field">
          <label class="label">Senha</label>
          <div class="input-wrapper">
            <input
              v-model="password"
              :type="showPass ? 'text' : 'password'"
              placeholder="********"
              autocomplete="current-password"
              :class="[
                'input',
                showErrors && !validPassword ? 'input--invalid' : '',
              ]"
            />
            <button type="button" class="btn-eye" @click="showPass = !showPass">
              <img
                :src="showPass ? eye : eyeOff"
                alt="Alternar visibilidade da senha"
              />
            </button>
          </div>
          <p v-if="showErrors && !validPassword" class="error-inline">
            Mínimo de 6 caracteres.
          </p>
        </div>

        <div class="form-row">
          <label class="checkbox">
            <input type="checkbox" v-model="remember" />
            <span>Lembrar-me</span>
          </label>
          <NuxtLink to="#" @click.prevent class="link caption">
            Esqueceu sua senha?
          </NuxtLink>
        </div>

        <button
          type="submit"
          class="btn btn-primary"
          :disabled="loading || !canSubmit || !hasFirebase"
        >
          <span v-if="!loading">Entrar</span>
          <span v-else>Entrando...</span>
        </button>

        <p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>
      </form>

      <div class="divider" role="separator">
        <span>ou continue com</span>
      </div>

      <div class="action">
        <button
          type="button"
          class="btn btn-outline btn-google"
          :disabled="googleLoading || loading || !hasFirebase"
          @click="loginWithGoogle"
        >
          <span class="google-mark" aria-hidden="true">G</span>
          <span>{{
            googleLoading ? "Conectando..." : "Entrar com Google"
          }}</span>
        </button>
      </div>

      <div class="divider" role="separator">
        <span>
          Ainda nao tem uma conta?
          <NuxtLink to="/register" class="link caption">Criar conta</NuxtLink>
        </span>
      </div>
    </section>

    <footer class="app-footer muted caption">
      &copy; {{ new Date().getFullYear() }} AlugaAI
    </footer>
  </main>
</template>

<script setup lang="ts">
import { useNuxtApp, useRoute, navigateTo } from "#app";
import { computed, onMounted, ref, watch } from "vue";
import {
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
  signInWithEmailAndPassword,
} from "firebase/auth";
import type { FirebaseError } from "firebase/app";
import eye from "@/assets/images/icons/visibility_24dp_000000_FILL0_wght400_GRAD0_opsz24.png";
import eyeOff from "@/assets/images/icons/visibility_off_24dp_000000_FILL0_wght400_GRAD0_opsz24.png";
import { useFirebaseUser } from "@/composables/useFirebaseUser";
import {
  ensureUserProfile,
  useUserProfile,
} from "@/composables/useUserProfile";

const nuxtApp = useNuxtApp();
const firebase = nuxtApp.$firebase;
const route = useRoute();
const { user: currentUser } = useFirebaseUser();
const { role } = useUserProfile();
const email = ref("");
const password = ref("");
const remember = ref(true);
const showPass = ref(false);
const showErrors = ref(false);
const loading = ref(false);
const googleLoading = ref(false);
const errorMessage = ref("");
const redirecting = ref(false);

const validEmail = computed(() => /\S+@\S+\.\S+/.test(email.value));
const validPassword = computed(() => (password.value?.length ?? 0) >= 6);
const canSubmit = computed(() => validEmail.value && validPassword.value);
const hasFirebase = computed(() => Boolean(firebase?.auth));

onMounted(() => {
  if (currentUser.value) {
    handleAuthenticatedUser(true);
  } else if (!hasFirebase.value) {
    errorMessage.value =
      "Firebase não está configurado. Atualize o .env com as credenciais.";
  }
});

watch(
  () => currentUser.value,
  (user) => {
    if (user) {
      handleAuthenticatedUser(true);
    }
  }
);

function formatFirebaseError(err: unknown): string {
  const error = err as Partial<FirebaseError> | null;
  const code = typeof error?.code === "string" ? error.code : "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return "Credenciais inválidas. Verifique e tente novamente.";
    case "auth/user-not-found":
      return "Usuário não encontrado.";
    case "auth/popup-closed-by-user":
      return "Login cancelado antes de finalizar.";
    case "PERMISSION_DENIED":
    case "database/permission-denied":
      return "Sem permissao para carregar seus dados. Verifique as regras do Realtime Database.";
    case "auth/network-request-failed":
      return "Falha de rede ao comunicar com o Firebase. Tente novamente em instantes.";
    default:
      return "Não foi possível entrar. Tente novamente em instantes.";
  }
}

async function handleAuthenticatedUser(force = false) {
  if (redirecting.value) return;
  if (!firebase?.auth) return;

  const authUser = firebase.auth.currentUser ?? currentUser.value;
  if (!authUser) return;
  if (!currentUser.value) {
    currentUser.value = authUser;
  }

  redirecting.value = true;
  try {
    await ensureUserProfile({ force, authUser });
    const destination = role.value === "admin" ? "/admin/home" : "/app/catalog";
    await navigateTo(destination, { replace: true });
  } catch (error) {
    console.error("[login] redirect error:", error);
    if (route.path !== "/app/catalog") {
      await navigateTo("/app/catalog", { replace: true });
    }
  } finally {
    redirecting.value = false;
  }
}

async function submit() {
  showErrors.value = true;
  errorMessage.value = "";
  if (!canSubmit.value || loading.value) return;
  if (!firebase?.auth) {
    errorMessage.value =
      "Firebase não está configurado. Verifique as variáveis de ambiente.";
    return;
  }

  loading.value = true;
  try {
    await setPersistence(
      firebase.auth,
      remember.value ? browserLocalPersistence : browserSessionPersistence
    );
    const credential = await signInWithEmailAndPassword(
      firebase.auth,
      email.value,
      password.value
    );
    if (!currentUser.value) {
      currentUser.value = credential.user;
    }
    await handleAuthenticatedUser(true);
  } catch (error) {
    errorMessage.value = formatFirebaseError(error);
  } finally {
    loading.value = false;
  }
}

async function loginWithGoogle() {
  errorMessage.value = "";
  if (googleLoading.value || loading.value) return;
  if (!firebase?.signInWithGoogle) {
    errorMessage.value =
      "Firebase não está configurado. Verifique as variáveis de ambiente.";
    return;
  }

  googleLoading.value = true;
  try {
    await firebase.signInWithGoogle();
    if (!currentUser.value && firebase.auth.currentUser) {
      currentUser.value = firebase.auth.currentUser;
    }
    await handleAuthenticatedUser(true);
  } catch (error) {
    errorMessage.value = formatFirebaseError(error);
  } finally {
    googleLoading.value = false;
  }
}
</script>

<style scoped>
.container-app {
  min-height: 100vh;
  display: grid;
  grid-template-rows: 1fr auto;
  place-items: center;
  padding: 24px;
  font-family: "Roboto", sans-serif;
}

.bg-app {
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background: radial-gradient(
      60rem 40rem at 10% -10%,
      rgba(33, 150, 243, 0.1),
      transparent 60%
    ),
    radial-gradient(
      40rem 30rem at 120% 10%,
      rgba(21, 101, 192, 0.1),
      transparent 55%
    ),
    radial-gradient(
      36rem 28rem at 50% 120%,
      rgba(16, 185, 129, 0.06),
      transparent 60%
    );
  filter: blur(var(--blur));
}

.card {
  width: min(92vw, 420px);
  border-radius: 20px;
  padding: 28px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(148, 163, 184, 0.35);
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.15);
  backdrop-filter: blur(12px);
  display: grid;
  gap: 20px;
}

.brand-mark {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgb(var(--surface-2));
  display: grid;
  place-items: center;
  border: 1px solid rgb(var(--stroke));
  font-size: 28px;
}

.h1 {
  font-size: 28px;
  line-height: 1.15;
  font-weight: 700;
  letter-spacing: 0.2px;
}

.muted {
  color: rgba(15, 23, 42, 0.6);
}

.caption {
  font-size: 16px;
  margin-top: 12px;
  margin-bottom: 8px;
}

.form {
  display: grid;
  gap: 18px;
}

.field {
  display: grid;
  gap: 10px;
}

.label {
  font-size: 14px;
  color: rgba(15, 23, 42, 0.65);
  font-weight: 500;
}

.input-wrapper {
  position: relative;
}

.input {
  width: 90%;
  border-radius: 14px;
  background: rgba(248, 250, 252, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.5);
  padding: 12px 20px;
  color: #0f172a;
  outline: none;
  transition: border 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
}

.input::placeholder {
  color: rgba(100, 116, 139, 0.8);
}

.input:hover {
  background: rgba(255, 255, 255, 0.95);
}

.input:focus {
  border-color: rgba(37, 99, 235, 0.7);
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.15);
}

.input--invalid {
  border-color: rgba(239, 68, 68, 0.9) !important;
  box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.2) !important;
}

.btn-eye {
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  border: none;
  background: transparent;
  padding: 0 14px;
  display: grid;
  place-items: center;
  cursor: pointer;
}

.form-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
}

.checkbox {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: rgba(15, 23, 42, 0.65);
}

.checkbox input {
  width: 16px;
  height: 16px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  padding: 12px 18px;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid transparent;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease,
    opacity 0.15s ease;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #2563eb, #38bdf8);
  color: #fff;
  box-shadow: 0 16px 32px rgba(37, 99, 235, 0.25);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 20px 40px rgba(37, 99, 235, 0.3);
}

.btn-outline {
  background: #fff;
  color: #0f172a;
  border-color: rgba(148, 163, 184, 0.5);
}

.btn-outline:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 16px 32px rgba(148, 163, 184, 0.22);
}

.btn-google {
  gap: 12px;
  font-weight: 600;
}

.google-mark {
  display: inline-grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #4285f4;
  color: #fff;
  font-weight: 700;
  font-size: 16px;
}

.link {
  color: #2563eb;
  text-decoration: none;
}

.link:hover {
  color: #1d4ed8;
}

.divider {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 14px;
  color: rgba(15, 23, 42, 0.6);
}

.divider::before,
.divider::after {
  content: "";
  flex: 1;
  height: 1px;
  background: rgba(148, 163, 184, 0.3);
}

.error-msg {
  margin-top: 4px;
  color: #dc2626;
  font-size: 13px;
}

.error-inline {
  font-size: 13px;
  color: #dc2626;
}

.action {
  display: grid;
  place-items: center;
}

.app-footer {
  text-align: center;
  padding: 16px;
  font-size: 13px;
}
</style>


