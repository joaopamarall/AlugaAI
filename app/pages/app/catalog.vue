<template>
  <div class="catalog-shell">
    <header class="catalog-header">
      <div class="brand">
        <span class="brand-mark">🛠️</span>
        <div class="brand-text">
          <p class="brand-title">AlugaAI</p>
          <p class="brand-sub">Seu portal de locações</p>
        </div>
      </div>
      <div class="header-actions">
        <div class="greeting">
          <span
            >Olá, <b>{{ userName }}</b></span
          >
          <span v-if="userEmail" class="email">{{ userEmail }}</span>
        </div>
        <button
          type="button"
          class="btn btn-outline"
          :disabled="signingOut"
          @click="signOut"
        >
          <span v-if="!signingOut">Sair</span>
          <span v-else>Saindo...</span>
        </button>
      </div>
    </header>

    <main class="catalog-main">
      <section class="items">
        <div class="items-head">
          <div>
            <h1>Catálogo de equipamentos</h1>
            <p>Escolha um item e defina o período da locação.</p>
          </div>
          <div class="search">
            <input
              v-model.trim="q"
              type="search"
              placeholder="Buscar por nome ou categoria"
            />
          </div>
        </div>

        <p v-if="itemsError" class="alert alert-error">{{ itemsError }}</p>
        <p v-if="successMessage" class="alert alert-success">
          {{ successMessage }}
        </p>

        <div v-if="loadingItems" class="empty">
          Carregando itens disponíveis...
        </div>
        <div v-else-if="filteredItems.length === 0" class="empty">
          Nenhum item disponível no momento. Tente novamente mais tarde.
        </div>
        <div v-else class="items-grid">
          <article
            v-for="item in filteredItems"
            :key="item.id"
            class="item-card"
          >
            <div v-if="item.imageUrl" class="item-image">
              <img :src="item.imageUrl" :alt="`Imagem de ${item.name}`" />
            </div>
            <div class="item-body">
              <h2>{{ item.name }}</h2>
              <p v-if="item.category" class="item-category">
                {{ item.category }}
              </p>
              <p v-if="item.description" class="item-description">
                {{ item.description }}
              </p>
            </div>
            <button
              type="button"
              class="btn btn-primary"
              @click="openRent(item)"
            >
              Alugar
            </button>
          </article>
        </div>
      </section>

      <section class="rentals">
        <header class="rentals-head">
          <h2>Minhas locações</h2>
          <p>Acompanhe o que esta alugado e as datas previstas.</p>
        </header>
        <p v-if="rentalsError" class="alert alert-error">{{ rentalsError }}</p>
        <div v-if="loadingRentals" class="empty">
          Carregando suas locações...
        </div>
        <div v-else-if="activeRentals.length === 0" class="empty">
          Voce ainda nao possui locações ativas.
        </div>
        <ul v-else class="rentals-list">
          <li v-for="r in activeRentals" :key="r.id" class="rental-item">
            <div class="rental-main">
              <h3>{{ r.itemName }}</h3>
              <p class="rental-status">
                Status:
                <span>
                  {{ r.status === "open" ? "Ativa" : r.status }}
                </span>
              </p>
            </div>
            <div class="rental-dates">
              <p>
                Início:
                <strong>{{ formatDateTime(r.startDate) }}</strong>
              </p>
              <p>
                Devolução prevista:
                <strong>{{ formatDateTime(r.expectedReturnDate) }}</strong>
              </p>
            </div>
          </li>
        </ul>
      </section>
    </main>

    <transition name="fade">
      <div v-if="rentModalOpen" class="modal-overlay">
        <div class="modal">
          <header class="modal-head">
            <h3>Reservar {{ selectedItem?.name }}</h3>
            <button type="button" class="modal-close" @click="closeRent">
              x
            </button>
          </header>

          <form class="modal-form" @submit.prevent="submitRental">
            <div class="field">
              <label>Início*</label>
              <input v-model="rentForm.start" type="datetime-local" required />
            </div>
            <div class="field">
              <label>Fim previsto*</label>
              <input v-model="rentForm.end" type="datetime-local" required />
            </div>
            <div class="field">
              <label>Observações</label>
              <textarea
                v-model.trim="rentForm.notes"
                rows="3"
                placeholder="Informacoes adicionais"
              ></textarea>
            </div>
            <p v-if="formError" class="alert alert-error">{{ formError }}</p>
            <div class="modal-actions">
              <button type="submit" class="btn btn-primary" :disabled="saving">
                <span v-if="!saving">Confirmar locação</span>
                <span v-else>Enviando...</span>
              </button>
              <button
                type="button"
                class="btn btn-outline"
                :disabled="saving"
                @click="closeRent"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>

    <p v-if="signOutError" class="alert alert-error fixed-alert">
      {{ signOutError }}
    </p>
  </div>
</template>

<script setup lang="ts">
import {
  equalTo,
  onValue,
  orderByChild,
  push,
  query,
  ref as dbRef,
  set,
  update,
} from "firebase/database";
import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from "vue";
import { useFirebaseUser } from "@/composables/useFirebaseUser";
import { resetUserProfile } from "@/composables/useUserProfile";

type Unsubscribe = () => void;

type Item = {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  imageUrl: string | null;
};

type Rental = {
  id: string;
  itemId: string;
  itemName: string;
  startDate: string;
  expectedReturnDate: string;
  status: string;
};

const nuxtApp = useNuxtApp();
const firebase = nuxtApp.$firebase;

const { user } = useFirebaseUser();

const q = ref("");
const items = ref<Item[]>([]);
const loadingItems = ref(true);
const itemsError = ref("");

const activeRentals = ref<Rental[]>([]);
const loadingRentals = ref(true);
const rentalsError = ref("");

const successMessage = ref("");
const successTimer = ref<number | null>(null);

const rentModalOpen = ref(false);
const selectedItem = ref<Item | null>(null);
const rentForm = reactive({
  start: "",
  end: "",
  notes: "",
});
const saving = ref(false);
const formError = ref("");

const signingOut = ref(false);
const signOutError = ref("");

const userName = computed(() => {
  if (user.value?.displayName) {
    return user.value.displayName;
  }
  if (user.value?.email) {
    return user.value.email.split("@")[0];
  }
  return "Cliente";
});
const userEmail = computed(() => user.value?.email ?? "");

const filteredItems = computed(() => {
  const term = q.value.trim().toLowerCase();
  if (!term) return items.value;
  return items.value.filter((item) => {
    return (
      item.name.toLowerCase().includes(term) ||
      (item.category && item.category.toLowerCase().includes(term))
    );
  });
});

function toInputValue(date: Date) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
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
    }, 5000);
  }
}

const unsubscribers: Unsubscribe[] = [];
let rentalsStop: Unsubscribe | null = null;

onMounted(() => {
  if (!firebase?.database) {
    const message =
      "Firebase nao esta configurado. Atualize as variaveis de ambiente.";
    itemsError.value = message;
    rentalsError.value = message;
    loadingItems.value = false;
    loadingRentals.value = false;
    return;
  }

  const itemsRef = dbRef(firebase.database, "items");
  const itemsQuery = query(
    itemsRef,
    orderByChild("status"),
    equalTo("available")
  );
  const stopItems = onValue(
    itemsQuery,
    (snapshot) => {
      const payload = snapshot.val() as Record<string, unknown> | null;
      const list = payload
        ? Object.entries(payload).map(([id, raw]) => {
            const data = (raw ?? {}) as Record<string, unknown>;
            return {
              id,
              name: String(data.name ?? "Sem nome"),
              category: data.category ? String(data.category) : null,
              description: data.description ? String(data.description) : null,
              imageUrl: data.imageUrl ? String(data.imageUrl) : null,
            } as Item;
          })
        : [];
      items.value = list;
      loadingItems.value = false;
      itemsError.value = "";
    },
    (error) => {
      console.error("[catalog] items listener error:", error);
      itemsError.value =
        "Nao foi possivel carregar os itens. Tente novamente em instantes.";
      loadingItems.value = false;
    }
  );
  unsubscribers.push(stopItems);
});

watch(
  () => user.value?.uid,
  (uid) => {
    if (!firebase?.database) return;

    if (rentalsStop) {
      rentalsStop();
      rentalsStop = null;
    }

    if (!uid) {
      activeRentals.value = [];
      loadingRentals.value = false;
      return;
    }

    loadingRentals.value = true;
    const rentalsRef = dbRef(firebase.database, "rentals");
    const rentalsQuery = query(
      rentalsRef,
      orderByChild("lesseeId"),
      equalTo(uid)
    );
    rentalsStop = onValue(
      rentalsQuery,
      (snapshot) => {
        const payload = snapshot.val() as Record<string, unknown> | null;
        const list = payload
          ? Object.entries(payload).map(([id, raw]) => {
              const data = (raw ?? {}) as Record<string, unknown>;
              const startIso =
                toIso(data.startDate) ?? new Date().toISOString();
              const endIso =
                toIso(data.expectedReturnDate) ?? new Date().toISOString();
              return {
                id,
                itemId: String(data.itemId ?? ""),
                itemName: String(data.itemName ?? "Sem nome"),
                startDate: startIso,
                expectedReturnDate: endIso,
                status: String(data.status ?? "open"),
              } as Rental;
            })
          : [];
        activeRentals.value = list
          .filter((rental) => rental.status !== "closed")
          .sort((a, b) => {
            return (
              new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
            );
          });
        loadingRentals.value = false;
        rentalsError.value = "";
      },
      (error) => {
        console.error("[catalog] rentals listener error:", error);
        rentalsError.value =
          "Nao foi possivel carregar suas locacoes. Atualize a pagina.";
        loadingRentals.value = false;
      }
    );
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  unsubscribers.forEach((stop) => stop());
  if (rentalsStop) {
    rentalsStop();
  }
  if (typeof window !== "undefined" && successTimer.value) {
    window.clearTimeout(successTimer.value);
  }
});

function openRent(item: Item) {
  selectedItem.value = item;
  formError.value = "";
  const now = new Date();
  rentForm.start = toInputValue(now);
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  rentForm.end = toInputValue(tomorrow);
  rentForm.notes = "";
  rentModalOpen.value = true;
}

function closeRent() {
  rentModalOpen.value = false;
  selectedItem.value = null;
  rentForm.start = "";
  rentForm.end = "";
  rentForm.notes = "";
  formError.value = "";
  saving.value = false;
}

async function submitRental() {
  formError.value = "";
  if (!firebase?.database) {
    formError.value =
      "Firebase nao esta configurado. Verifique as variaveis de ambiente.";
    return;
  }
  if (!user.value) {
    formError.value = "Sessao expirada. Entre novamente para continuar.";
    return;
  }
  if (!selectedItem.value) {
    formError.value = "Selecione um item para prosseguir.";
    return;
  }

  const start = new Date(rentForm.start);
  const end = new Date(rentForm.end);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    formError.value = "Informe datas validas.";
    return;
  }
  if (start >= end) {
    formError.value =
      "A data de devolucao deve ser maior do que a data de inicio.";
    return;
  }

  saving.value = true;
  try {
    const rentalsRef = dbRef(firebase.database, "rentals");
    const rentalRef = push(rentalsRef);
    const rentalId = rentalRef.key;
    if (!rentalId) {
      throw new Error("Falha ao gerar identificador da locacao.");
    }

    const nowIso = new Date().toISOString();
    await set(rentalRef, {
      id: rentalId,
      itemId: selectedItem.value.id,
      itemName: selectedItem.value.name,
      itemCategory: selectedItem.value.category,
      itemImageUrl: selectedItem.value.imageUrl,
      lesseeId: user.value.uid,
      lesseeName: userName.value,
      lesseeEmail: userEmail.value || null,
      notes: rentForm.notes.trim() || null,
      startDate: start.toISOString(),
      expectedReturnDate: end.toISOString(),
      status: "open",
      createdBy: "client",
      createdAt: nowIso,
      updatedAt: nowIso,
    });

    await update(dbRef(firebase.database, `items/${selectedItem.value.id}`), {
      status: "rented",
      updatedAt: nowIso,
    });

    setSuccess("Locacao criada com sucesso!");
    closeRent();
  } catch (error) {
    console.error("[catalog] submit rental error:", error);
    formError.value =
      "Nao foi possivel criar a locacao. Tente novamente em instantes.";
  } finally {
    saving.value = false;
  }
}

async function signOut() {
  signOutError.value = "";
  if (signingOut.value) return;
  if (!firebase?.signOutFirebase) {
    signOutError.value =
      "Firebase nao esta disponivel no momento. Atualize a pagina.";
    return;
  }

  signingOut.value = true;
  try {
    await firebase.signOutFirebase();
    resetUserProfile();
    await navigateTo("/login");
  } catch (error) {
    console.error("[catalog] signOut error:", error);
    signOutError.value =
      "Nao foi possivel encerrar a sessao. Tente novamente em instantes.";
  } finally {
    signingOut.value = false;
  }
}

function formatDateTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "--/--/---- --:--";
  }
  return date.toLocaleString();
}

function toIso(value: unknown): string | null {
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString();
    }
  }
  return null;
}
</script>

<style scoped>
.catalog-shell {
  min-height: 100vh;
  background: linear-gradient(
    180deg,
    rgba(248, 250, 252, 0.98),
    rgba(226, 232, 240, 0.9)
  );
  padding-bottom: 48px;
  color: #0f172a;
  font-family: "Roboto", ui-sans-serif, system-ui, -apple-system, Segoe UI,
    Helvetica, Arial;
}

.catalog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28px clamp(16px, 6vw, 80px);
  gap: 24px;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 14px;
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: linear-gradient(135deg, #2563eb, #38bdf8);
  color: #fff;
  font-weight: 800;
  letter-spacing: 0.4px;
}

.brand-title {
  font-size: 20px;
  font-weight: 700;
}

.brand-sub {
  font-size: 14px;
  color: rgba(15, 23, 42, 0.65);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.greeting {
  display: grid;
  gap: 2px;
  font-size: 15px;
}

.greeting .email {
  font-size: 13px;
  color: rgba(15, 23, 42, 0.65);
}

.catalog-main {
  display: grid;
  gap: clamp(48px, 6vw, 72px);
  padding: 0 clamp(16px, 6vw, 80px) clamp(48px, 8vw, 96px);
}

.items-head {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 32px;
}

.items-head h1 {
  font-size: clamp(26px, 3vw, 38px);
}

.items-head p {
  color: rgba(15, 23, 42, 0.65);
}

@media (min-width: 900px) {
  .items-head {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.search input {
  width: min(320px, 100%);
  border-radius: 14px;
  padding: 12px 16px;
  border: 1px solid rgba(148, 163, 184, 0.45);
  background: rgba(255, 255, 255, 0.9);
  outline: none;
  transition: border 0.15s ease, box-shadow 0.15s ease;
}

.search input:focus {
  border-color: rgba(37, 99, 235, 0.7);
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
}

.items-grid {
  display: grid;
  gap: 24px;
}

@media (min-width: 900px) {
  .items-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.item-card {
  display: grid;
  gap: 16px;
  background: rgba(255, 255, 255, 0.92);
  padding: 20px;
  border-radius: 20px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  box-shadow: 0 24px 48px rgba(15, 23, 42, 0.08);
}

.item-image {
  width: 100%;
  overflow: hidden;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(248, 250, 252, 0.9);
}

.item-image img {
  width: 100%;
  height: 180px;
  object-fit: cover;
  display: block;
}

.item-body h2 {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 6px;
}

.item-category {
  font-size: 14px;
  font-weight: 600;
  color: #2563eb;
}

.item-description {
  font-size: 14px;
  color: rgba(15, 23, 42, 0.7);
  margin-top: 6px;
}

.rentals-head {
  display: grid;
  gap: 4px;
  margin-bottom: 24px;
}

.rentals-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 16px;
}

.rental-item {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px 20px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(148, 163, 184, 0.3);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
}

@media (min-width: 720px) {
  .rental-item {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.rental-main h3 {
  font-size: 18px;
  font-weight: 700;
}

.rental-status span {
  font-weight: 600;
  color: #0f172a;
}

.rental-dates {
  display: grid;
  gap: 6px;
  font-size: 14px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  padding: 12px 20px;
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
  background: rgba(255, 255, 255, 0.95);
  border-color: rgba(148, 163, 184, 0.4);
  color: #1f2937;
}

.btn-outline:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 12px 28px rgba(100, 116, 139, 0.18);
}

.empty {
  padding: 32px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px dashed rgba(148, 163, 184, 0.4);
  text-align: center;
  color: rgba(15, 23, 42, 0.6);
  font-size: 15px;
}

.alert {
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
}

.alert-error {
  background: rgba(248, 113, 113, 0.15);
  color: #b91c1c;
  border: 1px solid rgba(248, 113, 113, 0.35);
}

.alert-success {
  background: rgba(52, 211, 153, 0.18);
  color: #047857;
  border: 1px solid rgba(52, 211, 153, 0.35);
}

.fixed-alert {
  position: fixed;
  right: clamp(16px, 6vw, 72px);
  bottom: clamp(16px, 6vw, 72px);
  max-width: 320px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 40;
}

.modal {
  width: min(420px, 100%);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid rgba(148, 163, 184, 0.35);
  box-shadow: 0 34px 68px rgba(15, 23, 42, 0.2);
  padding: 24px;
  display: grid;
  gap: 20px;
}

.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.modal-head h3 {
  font-size: 20px;
  font-weight: 700;
}

.modal-close {
  border: none;
  background: rgba(148, 163, 184, 0.2);
  width: 32px;
  height: 32px;
  border-radius: 10px;
  font-size: 16px;
  cursor: pointer;
}

.modal-close:hover {
  background: rgba(148, 163, 184, 0.35);
}

.modal-form {
  display: grid;
  gap: 16px;
}

.field {
  display: grid;
  gap: 8px;
}

.field label {
  font-size: 14px;
  color: rgba(15, 23, 42, 0.65);
}

.field input,
.field textarea {
  width: 90%;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.45);
  padding: 12px 14px;
  font-size: 15px;
  outline: none;
  transition: border 0.15s ease, box-shadow 0.15s ease;
}

.field input:focus,
.field textarea:focus {
  border-color: rgba(37, 99, 235, 0.7);
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
}

.modal-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 8px;
}
</style>
