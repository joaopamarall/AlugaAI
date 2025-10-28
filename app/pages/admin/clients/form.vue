<template>
  <main class="clients-shell">
    <section class="card">
      <header class="card-head">
        <h1 class="h1">Adicionar novo cliente</h1>
        <p class="subtitle">
          Cadastre dados essenciais para clientes que ainda não possuem conta na
          plataforma.
        </p>
      </header>

      <form @submit.prevent="submit" class="form" novalidate>
        <div class="grid">
          <label class="field">
            <span>Nome completo*</span>
            <input
              v-model.trim="form.nome"
              class="input"
              placeholder="Ex.: Joao da Silva"
              required
            />
          </label>
          <label class="field">
            <span>E-mail*</span>
            <input
              v-model.trim="form.email"
              type="email"
              inputmode="email"
              autocomplete="email"
              class="input"
              placeholder="cliente@email.com"
              required
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
            <span>CPF/CNPJ*</span>
            <input
              v-model.trim="form.documento"
              class="input"
              placeholder="000.000.000-00"
              required
            />
          </label>
        </div>

        <label class="field">
          <span>Endereço</span>
          <input
            v-model.trim="form.endereco"
            class="input"
            placeholder="Rua, numero, bairro"
          />
        </label>

        <p v-if="errorMessage" class="alert alert-error">{{ errorMessage }}</p>
        <p v-if="successMessage" class="alert alert-success">
          {{ successMessage }}
        </p>

        <div class="actions">
          <button type="submit" class="btn btn-primary" :disabled="saving">
            <span v-if="!saving">Salvar cliente</span>
            <span v-else>Salvando...</span>
          </button>
          <NuxtLink to="/admin/home" class="btn btn-outline">Voltar</NuxtLink>
        </div>
      </form>
    </section>

    <section class="card">
      <header class="list-head">
        <div>
          <h2>Usuários com conta</h2>
          <p>
            Lista sincronizada com os usuários autenticados (coleção users).
          </p>
        </div>
        <span v-if="loadingUsers" class="tag tag-muted">Carregando...</span>
      </header>

      <p v-if="usersError" class="alert alert-error">{{ usersError }}</p>
      <div v-else-if="users.length === 0" class="empty">
        Nenhum usuario encontrado.
      </div>
      <div v-else class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Papel</th>
              <th>Criado em</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>{{ user.displayName ?? "-" }}</td>
              <td>{{ user.email ?? "-" }}</td>
              <td class="capitalize">{{ user.role ?? "-" }}</td>
              <td>{{ formatDate(user.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="card">
      <header class="list-head">
        <div>
          <h2>Clientes cadastrados pelo admin</h2>
          <p>Dados armazenados na coleção clients.</p>
        </div>
        <span v-if="loadingClients" class="tag tag-muted">Carregando...</span>
      </header>

      <p v-if="clientsError" class="alert alert-error">{{ clientsError }}</p>
      <div v-else-if="clients.length === 0" class="empty">
        Nenhum cliente adicional cadastrado ainda.
      </div>
      <div v-else class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Telefone</th>
              <th>Documento</th>
              <th>Criado em</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="client in clients" :key="client.id">
              <td>{{ client.nome }}</td>
              <td>{{ client.email || "-" }}</td>
              <td>{{ client.telefone || "-" }}</td>
              <td>{{ client.documento }}</td>
              <td>{{ formatDate(client.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { onValue, push, ref as dbRef, set } from "firebase/database";
import { onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { useFirebaseUser } from "@/composables/useFirebaseUser";

type Unsubscribe = () => void;

const nuxtApp = useNuxtApp();
const firebase = nuxtApp.$firebase;
const { user: currentUser } = useFirebaseUser();

const form = reactive({
  nome: "",
  email: "",
  telefone: "",
  documento: "",
  endereco: "",
});

const saving = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const successTimer = ref<number | null>(null);

const users = ref<
  Array<{
    id: string;
    displayName: string | null;
    email: string | null;
    role: string | null;
    createdAt: Date | null;
  }>
>([]);

const clients = ref<
  Array<{
    id: string;
    nome: string;
    email: string | null;
    telefone: string | null;
    documento: string;
    createdAt: Date | null;
  }>
>([]);

const loadingUsers = ref(true);
const loadingClients = ref(true);
const usersError = ref("");
const clientsError = ref("");

const unsubscribers: Unsubscribe[] = [];

onMounted(() => {
  if (!firebase?.database) {
    const message =
      "Firebase não configurado. Verifique as variáveis de ambiente.";
    errorMessage.value = message;
    usersError.value = message;
    clientsError.value = message;
    loadingUsers.value = false;
    loadingClients.value = false;
    return;
  }

  const usersRef = dbRef(firebase.database, "users");
  const stopUsers = onValue(
    usersRef,
    (snapshot) => {
      const payload = snapshot.val() as Record<string, unknown> | null;
      const list = payload
        ? Object.entries(payload).map(([id, raw]) => {
            const data = (raw ?? {}) as Record<string, unknown>;
            return {
              id,
              displayName: data.displayName ? String(data.displayName) : null,
              email: data.email ? String(data.email) : null,
              role: data.role ? String(data.role) : null,
              createdAt: toDate(data.createdAt),
            };
          })
        : [];
      users.value = list.sort((a, b) => {
        const current = a.displayName ?? a.email ?? "";
        const next = b.displayName ?? b.email ?? "";
        return current.localeCompare(next, "pt-BR");
      });
      loadingUsers.value = false;
      usersError.value = "";
    },
    (error) => {
      console.error("[clients] users snapshot error:", error);
      usersError.value = "Não foi possível carregar os usuários.";
      loadingUsers.value = false;
    }
  );
  unsubscribers.push(stopUsers);

  const clientsRef = dbRef(firebase.database, "clients");
  const stopClients = onValue(
    clientsRef,
    (snapshot) => {
      const payload = snapshot.val() as Record<string, unknown> | null;
      const list = payload
        ? Object.entries(payload).map(([id, raw]) => {
            const data = (raw ?? {}) as Record<string, unknown>;
            return {
              id,
              nome: String(data.nome ?? ""),
              email: data.email ? String(data.email) : null,
              telefone: data.telefone ? String(data.telefone) : null,
              documento: String(data.documento ?? ""),
              createdAt: toDate(data.createdAt),
            };
          })
        : [];
      clients.value = list.sort((a, b) => {
        const aTime = a.createdAt?.getTime() ?? 0;
        const bTime = b.createdAt?.getTime() ?? 0;
        return bTime - aTime;
      });
      loadingClients.value = false;
      clientsError.value = "";
    },
    (error) => {
      console.error("[clients] clients snapshot error:", error);
      clientsError.value = "Não foi possível carregar os clientes.";
      loadingClients.value = false;
    }
  );
  unsubscribers.push(stopClients);
});

onBeforeUnmount(() => {
  unsubscribers.forEach((stop) => stop());
  if (typeof window !== "undefined" && successTimer.value) {
    window.clearTimeout(successTimer.value);
  }
});

function resetForm() {
  form.nome = "";
  form.email = "";
  form.telefone = "";
  form.documento = "";
  form.endereco = "";
}

function setSuccess(message: string) {
  successMessage.value = message;
  if (typeof window !== "undefined") {
    if (successTimer.value) {
      window.clearTimeout(successTimer.value);
    }
    successTimer.value = window.setTimeout(() => {
      successMessage.value = "";
      successTimer.value = null;
    }, 4000);
  }
}

async function submit() {
  errorMessage.value = "";
  if (!form.nome || !form.email || !form.documento) {
    errorMessage.value = "Preencha os campos obrigatórios.";
    return;
  }
  if (!firebase?.database) {
    errorMessage.value = "Firebase não configurado.";
    return;
  }

  saving.value = true;
  try {
    const clientsRef = dbRef(firebase.database, "clients");
    const newClientRef = push(clientsRef);
    await set(newClientRef, {
      nome: form.nome.trim(),
      email: form.email.trim(),
      telefone: form.telefone.trim() || null,
      documento: form.documento.trim(),
      endereco: form.endereco.trim() || null,
      createdAt: new Date().toISOString(),
      createdBy: currentUser.value?.uid ?? null,
    });

    setSuccess("Cliente cadastrado com sucesso.");
    resetForm();
  } catch (error) {
    console.error("[clients] add client error:", error);
    errorMessage.value = "N�o foi poss�vel salvar o cliente.";
  } finally {
    saving.value = false;
  }
}

function formatDate(date: Date | null) {
  if (!date) return "-";
  return date.toLocaleDateString();
}

function toDate(value: unknown): Date | null {
  if (typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}
</script>

<style scoped>
.clients-shell {
  display: grid;
  gap: 32px;
  padding: clamp(24px, 6vw, 60px);
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.9), #fff);
  font-family: "Roboto", ui-sans-serif, system-ui, -apple-system, Segoe UI,
    Helvetica, Arial;
}

.card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.1);
  padding: clamp(24px, 5vw, 40px);
  display: grid;
  gap: 20px;
}

.card-head {
  display: grid;
  gap: 8px;
}

.h1 {
  font-size: clamp(24px, 4vw, 30px);
  font-weight: 700;
}

.subtitle {
  color: rgba(15, 23, 42, 0.65);
  font-size: 15px;
}

.form {
  display: grid;
  gap: 18px;
}

.grid {
  display: grid;
  gap: 16px;
}

@media (min-width: 720px) {
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.field {
  display: grid;
  gap: 8px;
  font-size: 14px;
  color: rgba(15, 23, 42, 0.75);
}

.input {
  width: 90%;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.5);
  background: rgba(248, 250, 252, 0.92);
  padding: 12px 14px;
  padding-left: 20px;
  font-size: 15px;
  outline: none;
  transition: border 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
}

.input:focus {
  border-color: rgba(37, 99, 235, 0.7);
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
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
  padding: 12px 18px;
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

.btn-outline:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 28px rgba(148, 163, 184, 0.2);
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

.list-head {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

@media (min-width: 720px) {
  .list-head {
    flex-direction: row;
    align-items: baseline;
    justify-content: space-between;
  }
}

.empty {
  padding: 24px;
  text-align: center;
  color: rgba(15, 23, 42, 0.6);
  border-radius: 16px;
  border: 1px dashed rgba(148, 163, 184, 0.4);
}

.table-wrapper {
  overflow-x: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.table th,
.table td {
  padding: 10px 12px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.2);
  text-align: left;
}

.table th {
  font-weight: 600;
  color: rgba(15, 23, 42, 0.65);
}

.capitalize {
  text-transform: capitalize;
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
