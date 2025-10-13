<template>
  <main class="container-app">
    <div class="bg-app"></div>

    <section class="card">
      <header class="grid place-items-center text-center gap-1 mb-6">
        <div class="brand-mark">🛠️</div>
        <h1 class="h1">AlugaAI</h1>
        <p class="muted caption">Acesse sua conta</p>
      </header>

      <form @submit.prevent="submit" class="grid gap-4" novalidate>
        <div>
          <label class="block caption muted mb-1">E-mail</label>
          <input
            v-model.trim="email"
            type="email"
            inputmode="email"
            placeholder="voce@email.com"
            autocomplete="email"
            :class="[
              'input ',
              showErrors && !validEmail ? 'input--invalid' : '',
            ]"
          />
          <p
            v-if="showErrors && !validEmail"
            class="mt-1 caption"
            style="color: rgb(220, 38, 38)"
          >
            Informe um e-mail válido.
          </p>
        </div>

        <div>
          <label class="block caption muted mb-1">Senha</label>
          <div class="relative">
            <input
              v-model="password"
              :type="showPass ? 'text' : 'password'"
              placeholder="••••••••"
              autocomplete="current-password"
              :class="[
                'input',
                'pr-24',
                showErrors && !validPassword ? 'input--invalid' : '',
              ]"
            />
            <button type="button" class="btn-eye" @click="showPass = !showPass">
              <img :src="showPass ? eye : eyeOff" />
            </button>
          </div>
          <p
            v-if="showErrors && !validPassword"
            class="mt-1 caption"
            style="color: rgb(220, 38, 38)"
          >
            Mínimo de 6 caracteres.
          </p>
        </div>

        <div class="flex items-center justify-between">
          <label class="inline-flex items-center caption muted">
            <input
              type="checkbox"
              v-model="remember"
              class="size-4 rounded border-slate-300"
            />
            Lembrar-me
          </label>
          <NuxtLink to="#" @click.prevent class="link caption"
            >Esqueceu a senha?</NuxtLink
          >
        </div>
        <button
          type="submit"
          :disabled="loading || !canSubmit"
          class="btn btn-primary btn-entrar"
        >
          <span v-if="!loading">Entrar</span>
          <span v-else>Entrando…</span>
        </button>
      </form>
    </section>

    <footer class="w-full text-center p-4 muted caption">
      © {{ new Date().getFullYear() }} AlugaAI
    </footer>
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import eye from "@/assets/images/icons/visibility_24dp_000000_FILL0_wght400_GRAD0_opsz24.png";
import eyeOff from "@/assets/images/icons/visibility_off_24dp_000000_FILL0_wght400_GRAD0_opsz24.png";

const email = ref("");
const password = ref("");
const remember = ref(true);
const showPass = ref(false);
const showErrors = ref(false);
const loading = ref(false);

const validEmail = computed(() => /\S+@\S+\.\S+/.test(email.value));
const validPassword = computed(() => (password.value?.length ?? 0) >= 6);
const canSubmit = computed(() => validEmail.value && validPassword.value);

async function submit() {
  showErrors.value = true;
  if (!canSubmit.value || loading.value) return;
  loading.value = true;
  try {
    const user = {
      email: email.value,
      role: "gestor",
      loggedAt: new Date().toISOString(),
    };
    if (remember.value && process.client)
      localStorage.setItem("alugaai:user", JSON.stringify(user));
    await navigateTo("/home");
  } finally {
    loading.value = false;
  }
}
function goGuest() {
  if (process.client) {
    localStorage.setItem(
      "alugaai:user",
      JSON.stringify({
        email: "guest@aluga.ai",
        role: "cliente",
        loggedAt: new Date().toISOString(),
      })
    );
  }
  navigateTo("/home");
}
</script>

<style scoped>
/* Background decor minimal (bem discreto) */
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

/* Layout */
.container-app {
  min-height: 100dvh;
  display: grid;
  grid-template-rows: 1fr auto;
  place-items: center;
  padding: 24px;
  font-family: "Roboto", sans-serif;
}

/* Card/Surface */
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

/* Tipografia utilitária */
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

/* Marca/ícone */
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

/* Inputs */
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

/* Botões */
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
  top: 258px;
  right: 48px;
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

/* Links */
.link {
  color: rgb(var(--brand));
}
.link:hover {
  color: rgb(var(--brand-strong));
}
</style>
