<template>
  <main class="container-app">
    <div class="bg-app"></div>

    <section class="card">
      <header class="grid place-items-center text-center gap-1 mb-6">
        <div class="brand-mark">???</div>
        <h1 class="h1">AlugaAI</h1>
        <p class="muted caption">Crie sua conta</p>
      </header>

      <form @submit.prevent="submit" class="grid gap-4" novalidate>
        <div>
          <label class="block caption muted mb-1">Nome</label>
          <input
            v-model.trim="displayName"
            type="text"
            placeholder="Seu nome completo"
            autocomplete="name"
            :class="['input', showErrors && !validName ? 'input--invalid' : '']"
          />
          <p
            v-if="showErrors && !validName"
            class="caption"
            style="color: rgb(220, 38, 38)"
          >
            Informe seu nome completo.
          </p>
        </div>

        <div>
          <label class="block caption muted mb-1">E-mail</label>
          <input
            v-model.trim="email"
            type="email"
            inputmode="email"
            placeholder="voce@email.com"
            autocomplete="email"
            :class="['input', showErrors && !validEmail ? 'input--invalid' : '']"
          />
          <p
            v-if="showErrors && !validEmail"
            class="caption"
            style="color: rgb(220, 38, 38)"
          >
            Informe um e-mail valido.
          </p>
        </div>

        <div>
          <label class="block caption muted mb-1">Senha</label>
          <div class="relative">
            <input
              v-model="password"
              :type="showPass ? 'text' : 'password'"
              placeholder="********"
              autocomplete="new-password"
              :class="[
                'input',
                'pr-24',
                showErrors && !validPassword ? 'input--invalid' : '',
              ]"
            />
            <button type="button" class="btn-eye" @click="showPass = !showPass">
              <img :src="showPass ? eye : eyeOff" alt="" />
            </button>
          </div>
          <p
            v-if="showErrors && !validPassword"
            class="caption"
            style="color: rgb(220, 38, 38)"
          >
            Minimo de 6 caracteres.
          </p>
        </div>

        <div>
          <label class="block caption muted mb-1">Confirme a senha</label>
          <div class="relative">
            <input
              v-model="confirmPassword"
              :type="showConfirmPass ? 'text' : 'password'"
              placeholder="********"
              autocomplete="new-password"
              :class="[
                'input',
                'pr-24',
                showErrors && !passwordsMatch ? 'input--invalid' : '',
              ]"
            />
            <button
              type="button"
              class="btn-eye"
              @click="showConfirmPass = !showConfirmPass"
            >
              <img :src="showConfirmPass ? eye : eyeOff" alt="" />
            </button>
          </div>
          <p
            v-if="showErrors && !passwordsMatch"
            class="caption"
            style="color: rgb(220, 38, 38)"
          >
            As senhas nao conferem.
          </p>
        </div>

        <button
          type="submit"
          :disabled="loading || !canSubmit || !hasFirebase"
          class="btn btn-primary btn-entrar"
        >
          <span v-if="!loading">Criar conta</span>
          <span v-else>Criando...</span>
        </button>
        <p v-if="errorMessage" class="caption error-msg">{{ errorMessage }}</p>
      </form>

      <div class="divider" role="separator">
        <span>ou continue com</span>
      </div>

      <div class="place-items-center">
        <button
          type="button"
          class="btn btn-outline btn-google"
          :disabled="googleLoading || loading || !hasFirebase"
          @click="signUpWithGoogle"
        >
          <span class="google-mark" aria-hidden="true">G</span>
        <span>{{ googleLoading ? "Conectando..." : "Criar conta com Google" }}</span>
        </button>
      </div>

      <div class="divider place-items-center" role="separator">
        <span>
          Ja tem uma conta?
          <NuxtLink to="/" class="link caption">Entrar</NuxtLink>
        </span>
      </div>
    </section>

    <footer class="w-full text-center p-4 muted caption">
      &copy; {{ new Date().getFullYear() }} AlugaAI
    </footer>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import type { FirebaseError } from "firebase/app";
import eye from "@/assets/images/icons/visibility_24dp_000000_FILL0_wght400_GRAD0_opsz24.png";
import eyeOff from "@/assets/images/icons/visibility_off_24dp_000000_FILL0_wght400_GRAD0_opsz24.png";
import { useFirebaseUser } from "@/composables/useFirebaseUser";

const nuxtApp = useNuxtApp();
const firebase = nuxtApp.$firebase;
const { user: currentUser } = useFirebaseUser();

const displayName = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const showPass = ref(false);
const showConfirmPass = ref(false);
const showErrors = ref(false);
const loading = ref(false);
const googleLoading = ref(false);
const errorMessage = ref("");

const validName = computed(() => displayName.value.trim().length >= 3);
const validEmail = computed(() => /\S+@\S+\.\S+/.test(email.value));
const validPassword = computed(() => (password.value?.length ?? 0) >= 6);
const passwordsMatch = computed(
  () => password.value === confirmPassword.value && password.value !== ""
);
const canSubmit = computed(
  () =>
    validName.value &&
    validEmail.value &&
    validPassword.value &&
    passwordsMatch.value
);
const hasFirebase = computed(() => Boolean(firebase?.auth));

onMounted(() => {
  if (currentUser.value) {
    navigateTo("/home");
  } else if (!hasFirebase.value) {
    errorMessage.value =
      "Firebase nao esta configurado. Atualize o .env com as credenciais.";
  }
});

watch(
  () => currentUser.value,
  (user) => {
    if (user) {
      navigateTo("/home");
    }
  }
);

function formatFirebaseError(err: unknown): string {
  const error = err as Partial<FirebaseError> | null;
  const code = typeof error?.code === "string" ? error.code : "";
  switch (code) {
    case "auth/email-already-in-use":
      return "E-mail ja esta em uso.";
    case "auth/invalid-email":
      return "E-mail invalido.";
    case "auth/operation-not-allowed":
      return "Cadastro desativado pelo administrador.";
    case "auth/weak-password":
      return "Senha muito fraca. Escolha outra.";
    case "auth/network-request-failed":
      return "Falha de rede ao comunicar com o Firebase.";
    case "auth/popup-closed-by-user":
      return "Cadastro cancelado antes de finalizar.";
    default:
      return "Nao foi possivel concluir o cadastro. Tente novamente.";
  }
}

async function submit() {
  showErrors.value = true;
  errorMessage.value = "";
  if (!canSubmit.value || loading.value) return;
  if (!firebase?.auth) {
    errorMessage.value =
      "Firebase nao esta configurado. Verifique as variaveis de ambiente.";
    return;
  }

  loading.value = true;
  try {
    const credential = await createUserWithEmailAndPassword(
      firebase.auth,
      email.value,
      password.value
    );
    if (credential.user && validName.value) {
      await updateProfile(credential.user, {
        displayName: displayName.value.trim(),
      });
    }
  } catch (error) {
    errorMessage.value = formatFirebaseError(error);
  } finally {
    loading.value = false;
  }
}

async function signUpWithGoogle() {
  errorMessage.value = "";
  if (googleLoading.value || loading.value) return;
  if (!firebase?.signInWithGoogle) {
    errorMessage.value =
      "Firebase nao esta configurado. Verifique as variaveis de ambiente.";
    return;
  }

  googleLoading.value = true;
  try {
    await firebase.signInWithGoogle();
  } catch (error) {
    errorMessage.value = formatFirebaseError(error);
  } finally {
    googleLoading.value = false;
  }
}
</script>

<style scoped>
.bg-app {
  position: fixed;
  inset: 0;
  z-index: -10;
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

.container-app {
  min-height: 100dvh;
  display: grid;
  grid-template-rows: 1fr auto;
  place-items: center;
  padding: 24px;
  font-family: "Roboto", sans-serif;
}

.card {
  width: min(92vw, 420px);
  border-radius: var(--radius);
  padding: 28px;
  background: rgb(var(--surface));
  border: 1px solid rgb(var(--stroke));
  box-shadow: 0 10px 30px rgba(var(--shadow), 0.06),
    0 2px 8px rgba(var(--shadow), 0.04);
  backdrop-filter: blur(var(--blur));
}

.muted {
  color: rgb(var(--muted));
}
.h1 {
  font-size: 28px;
  line-height: 1.15;
  font-weight: 700;
  letter-spacing: 0.2px;
}
.caption {
  font-size: 16px;
  margin-top: 12px;
  margin-bottom: 8px;
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgb(var(--surface-2));
  border: 1px solid rgb(var(--stroke));
  font-size: 28px;
}

.input {
  width: 90%;
  border-radius: 12px;
  background: rgb(var(--surface));
  border: 1px solid rgb(var(--stroke));
  padding: 12px 14px;
  color: rgb(var(--text));
  outline: none;
  transition: border 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
}
.input::placeholder {
  color: rgba(var(--muted), 0.9);
}
.input:hover {
  background: rgb(var(--surface-2));
}
.input:focus {
  border-color: rgb(var(--brand));
  box-shadow: 0 0 0 6px rgba(var(--focus-ring), 0.14);
}
.input--invalid {
  border-color: rgb(var(--danger)) !important;
  box-shadow: 0 0 0 6px rgba(var(--danger), 0.14) !important;
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  padding: 12px 16px;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid transparent;
  transition: filter 0.15s ease, background 0.15s ease, opacity 0.15s ease,
    border 0.15s ease;
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  color: white;
  background: rgb(var(--brand));
  border-color: rgb(var(--brand));
  box-shadow: 0 8px 20px rgba(var(--brand), 0.25);
}
.btn-primary:hover {
  background: rgb(var(--brand-strong));
  border-color: rgb(var(--brand-strong));
}

.btn-eye {
  border: 0;
  background: none;
  position: absolute;
  top: 8px;
  right: 20px;
}

.btn-outline {
  color: rgb(var(--text));
  background: white;
  border-color: rgb(var(--stroke));
}
.btn-outline:hover {
  background: rgb(var(--surface-2));
}

.btn-entrar {
  margin-top: 12px;
}

.btn-google {
  margin-top: 8px;
  gap: 12px;
  font-weight: 600;
}
.btn-google:disabled {
  opacity: 0.7;
}
.google-mark {
  display: inline-grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #4285f4;
  color: #fff;
  font-weight: 700;
  font-size: 16px;
}

.divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 24px 0 12px;
  color: rgb(var(--muted));
  font-size: 14px;
}
.divider::before,
.divider::after {
  content: "";
  flex: 1;
  height: 1px;
  background: rgba(var(--muted), 0.25);
}

.error-msg {
  margin-top: 8px;
  color: rgb(220, 38, 38);
}

.link {
  color: rgb(var(--brand));
}
.link:hover {
  color: rgb(var(--brand-strong));
}
</style>
