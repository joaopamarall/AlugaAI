<template>
  <main class="profile-shell">
    <section class="card">
      <header class="card-head">
        <NuxtLink to="/admin/home" class="back-link">
          <span aria-hidden="true">←</span>
          <span>Voltar</span>
        </NuxtLink>
        <h1 class="h1">Editar perfil</h1>
        <p class="subtitle">
          Atualize suas informações pessoais e mantenha seus dados de contato em
          dia.
        </p>
      </header>

      <div v-if="loading" class="loading">
        <span class="tag tag-muted">Carregando perfil...</span>
      </div>
      <p v-else-if="loadError" class="alert alert-error">{{ loadError }}</p>

      <form
        v-else
        @submit.prevent="submit"
        class="form"
        novalidate
        autocomplete="off"
      >
        <div class="grid">
          <label class="field">
            <span>Nome completo*</span>
            <input v-model.trim="form.nome" class="input" required />
          </label>
          <label class="field">
            <span>E-mail</span>
            <input
              v-model="form.email"
              class="input"
              type="email"
              disabled
              readonly
            />
          </label>
        </div>

        <div class="grid">
          <label class="field">
            <span>Telefone</span>
            <input
              v-model.trim="form.telefone"
              class="input"
              placeholder="(00) 90000-0000"
            />
          </label>
          <label class="field">
            <span>CPF/CNPJ</span>
            <input
              v-model.trim="form.documento"
              class="input"
              placeholder="000.000.000-00"
            />
          </label>
        </div>

        <label class="field">
          <span>Endereço</span>
          <input
            v-model.trim="form.endereco"
            class="input"
            placeholder="Rua, número e bairro"
          />
        </label>

        <p v-if="errorMessage" class="alert alert-error">{{ errorMessage }}</p>
        <p v-if="successMessage" class="alert alert-success">
          {{ successMessage }}
        </p>

        <div class="actions">
          <button
            type="button"
            class="btn btn-outline"
            :disabled="saving || !hasChanges"
            @click="resetForm"
          >
            Descartar alterações
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="saving || !hasChanges"
          >
            <span v-if="!saving">Salvar alterações</span>
            <span v-else>Salvando...</span>
          </button>
        </div>
      </form>
    </section>
  </main>
</template>

<script setup lang="ts">
import { get, ref as dbRef, set, update } from "firebase/database";
import { updateProfile, type User } from "firebase/auth";
import { computed, onBeforeUnmount, reactive, ref, watch, type Ref } from "vue";
import { useFirebaseUser } from "@/composables/useFirebaseUser";
import { useUserProfile } from "@/composables/useUserProfile";

type ProfileSnapshot = {
  nome: string;
  email: string;
  telefone: string;
  documento: string;
  endereco: string;
};

const nuxtApp = useNuxtApp();
const firebase = nuxtApp.$firebase;

const { user } = useFirebaseUser();
const { role } = useUserProfile();

const loading = ref(true);
const saving = ref(false);
const loadError = ref("");
const errorMessage = ref("");
const successMessage = ref("");
const profileExists = ref(false);
const successTimer = ref<number | null>(null);

const form = reactive<ProfileSnapshot>({
  nome: "",
  email: "",
  telefone: "",
  documento: "",
  endereco: "",
});

const initialSnapshot: Ref<ProfileSnapshot | null> = ref(null);

const hasChanges = computed(() => {
  if (!initialSnapshot.value) return false;
  const current = currentSnapshot();
  return (
    current.nome !== initialSnapshot.value.nome ||
    current.email !== initialSnapshot.value.email ||
    current.telefone !== initialSnapshot.value.telefone ||
    current.documento !== initialSnapshot.value.documento ||
    current.endereco !== initialSnapshot.value.endereco
  );
});

watch(
  () => user.value?.uid,
  (uid) => {
    if (!uid) return;
    loadProfile(uid);
  },
  { immediate: true }
);

function currentSnapshot(): ProfileSnapshot {
  return {
    nome: form.nome.trim(),
    email: form.email.trim(),
    telefone: form.telefone.trim(),
    documento: form.documento.trim(),
    endereco: form.endereco.trim(),
  };
}

function applySnapshot(snapshot: ProfileSnapshot) {
  form.nome = snapshot.nome;
  form.email = snapshot.email;
  form.telefone = snapshot.telefone;
  form.documento = snapshot.documento;
  form.endereco = snapshot.endereco;
}

async function loadProfile(uid: string) {
  if (!firebase?.database) {
    loadError.value =
      "Firebase não configurado. Verifique as variáveis de ambiente.";
    loading.value = false;
    return;
  }

  loading.value = true;
  loadError.value = "";

  try {
    const userRef = dbRef(firebase.database, `users/${uid}`);
    const snapshot = await get(userRef);
    const baseEmail = user.value?.email?.trim() ?? "";

    if (!snapshot.exists()) {
      profileExists.value = false;
      const fallback: ProfileSnapshot = {
        nome: user.value?.displayName?.trim() ?? "",
        email: baseEmail,
        telefone: "",
        documento: "",
        endereco: "",
      };
      applySnapshot(fallback);
      initialSnapshot.value = fallback;
      return;
    }

    profileExists.value = true;

    const data = snapshot.val() as Record<string, unknown>;
    const resolved: ProfileSnapshot = {
      nome: typeof data.displayName === "string" ? data.displayName : "",
      email:
        typeof data.email === "string" && data.email ? data.email : baseEmail,
      telefone: typeof data.phone === "string" ? data.phone : "",
      documento: typeof data.document === "string" ? data.document : "",
      endereco: typeof data.address === "string" ? data.address : "",
    };

    applySnapshot(resolved);
    initialSnapshot.value = currentSnapshot();
  } catch (error) {
    console.error("[profile] load error:", error);
    loadError.value =
      "Não foi possível carregar seu perfil. Tente recarregar a página.";
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  if (!initialSnapshot.value) return;
  applySnapshot(initialSnapshot.value);
  errorMessage.value = "";
  successMessage.value = "";
}

async function submit() {
  errorMessage.value = "";
  successMessage.value = "";

  if (!user.value?.uid) {
    errorMessage.value = "Usuário não autenticado.";
    return;
  }

  if (!firebase?.database) {
    errorMessage.value =
      "Firebase não configurado. Verifique as variáveis de ambiente.";
    return;
  }

  const snapshot = currentSnapshot();

  if (!snapshot.nome) {
    errorMessage.value = "Informe seu nome completo.";
    return;
  }

  saving.value = true;
  const uid = user.value.uid;
  const nowIso = new Date().toISOString();
  const userRef = dbRef(firebase.database, `users/${uid}`);

  try {
    if (!profileExists.value) {
      await set(userRef, {
        uid,
        role: role.value ?? "client",
        isAdmin: role.value === "admin",
        email: snapshot.email || user.value.email || null,
        displayName: snapshot.nome,
        phone: snapshot.telefone || null,
        document: snapshot.documento || null,
        address: snapshot.endereco || null,
        createdAt: nowIso,
        updatedAt: nowIso,
      });
      profileExists.value = true;
    } else {
      const updates: Record<string, unknown> = {
        displayName: snapshot.nome,
        phone: snapshot.telefone || null,
        document: snapshot.documento || null,
        address: snapshot.endereco || null,
        updatedAt: nowIso,
      };
      if (snapshot.email) {
        updates.email = snapshot.email;
      }
      await update(userRef, updates);
    }

    await syncAuthDisplayName(snapshot.nome);

    initialSnapshot.value = snapshot;
    setSuccess("Perfil atualizado com sucesso.");
  } catch (error) {
    console.error("[profile] update error:", error);
    errorMessage.value =
      "Não foi possível salvar as alterações. Tente novamente em instantes.";
  } finally {
    saving.value = false;
  }
}

async function syncAuthDisplayName(displayName: string) {
  if (!firebase?.auth?.currentUser) return;
  const authUser = firebase.auth.currentUser;
  if (authUser.displayName === displayName) return;

  await updateProfile(authUser, { displayName });
  user.value = cloneAuthUser(authUser);
}

function cloneAuthUser(authUser: User): User {
  return Object.assign(
    Object.create(Object.getPrototypeOf(authUser)),
    authUser
  ) as User;
}

function setSuccess(message: string) {
  successMessage.value = message;
  if (typeof window === "undefined") return;
  if (successTimer.value) {
    window.clearTimeout(successTimer.value);
  }
  successTimer.value = window.setTimeout(() => {
    successMessage.value = "";
    successTimer.value = null;
  }, 12000);
}

onBeforeUnmount(() => {
  if (typeof window !== "undefined" && successTimer.value) {
    window.clearTimeout(successTimer.value);
  }
});
</script>

<style scoped>
.profile-shell {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: clamp(24px, 6vw, 60px);
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.9), #fff);
  min-height: 100vh;
}

.card {
  width: min(100%, 760px);
  background: rgba(255, 255, 255, 0.95);
  border-radius: 22px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.1);
  padding: clamp(24px, 5vw, 40px);
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.card-head {
  display: grid;
  gap: 12px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  color: rgba(15, 23, 42, 0.75);
  font-size: 14px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.7);
  box-shadow: 0 6px 12px rgba(15, 23, 42, 0.08);
  transition: transform 0.12s ease, box-shadow 0.12s ease;
  text-decoration: none;
}

.back-link:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 20px rgba(15, 23, 42, 0.12);
}

.h1 {
  font-size: clamp(24px, 4vw, 32px);
  font-weight: 700;
}

.subtitle {
  color: rgba(15, 23, 42, 0.65);
  font-size: 15px;
  max-width: 520px;
}

.loading {
  display: flex;
  justify-content: flex-start;
}

.form {
  display: grid;
  gap: clamp(18px, 3vw, 28px);
}

.grid {
  display: grid;
  gap: 16px;
}

@media (min-width: 620px) {
  .grid {
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 18px 20px;
  }
}

.field {
  display: grid;
  gap: 8px;
  font-size: 14px;
  color: rgba(15, 23, 42, 0.75);
}

.input {
  width: 100%;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.5);
  background: rgba(248, 250, 252, 0.92);
  padding: 12px 0px;
  padding-left: 4px;
  font-size: 15px;
  outline: none;
  transition: border 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
}

.input:focus {
  border-color: rgba(37, 99, 235, 0.7);
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
}

.input[disabled] {
  cursor: not-allowed;
  opacity: 0.7;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: flex-end;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  margin-right: -4px;
  padding: 12px 20px;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid transparent;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease,
    opacity 0.15s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #2563eb, #38bdf8);
  color: #fff;
  box-shadow: 0 16px 36px rgba(37, 99, 235, 0.25);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 24px 42px rgba(37, 99, 235, 0.3);
}

.btn-outline {
  background: #fff;
  color: #0f172a;
  border-color: rgba(148, 163, 184, 0.5);
}

.btn-outline:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 12px 28px rgba(148, 163, 184, 0.2);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

.alert {
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
}

.alert-error {
  background: rgba(248, 113, 113, 0.18);
  color: #b91c1c;
  border: 1px solid rgba(248, 113, 113, 0.35);
}

.alert-success {
  background: rgba(52, 211, 153, 0.18);
  color: #047857;
  border: 1px solid rgba(52, 211, 153, 0.35);
}

.tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
}

.tag-muted {
  background: rgba(148, 163, 184, 0.25);
  color: rgba(15, 23, 42, 0.65);
}
</style>
