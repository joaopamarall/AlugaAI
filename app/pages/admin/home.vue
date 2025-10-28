<template>
  <main class="home-shell">
    <div class="bg-decor"></div>

    <header class="topbar">
      <div class="brand">
        <div class="mark">🛠️</div>
        <div class="brand-txt">
          <div class="title">AlugaAI</div>
          <div class="subtitle">Painel</div>
        </div>
      </div>

      <div class="tools">
        <div class="search">
          <input
            v-model.trim="q"
            type="text"
            placeholder="Buscar itens ou locações..."
          />
          <span class="kbd">Ctrl+K</span>
        </div>
        <div class="user">
          <span class="hello"
            >Olá, <b>{{ userName }}</b></span
          >
          <button class="avatar" type="button" :title="userEmail">
            {{ userInitials }}
          </button>
          <button
            type="button"
            class="btn btn-outline btn-signout"
            :disabled="signingOut"
            @click="logout"
          >
            <span v-if="!signingOut">Sair</span>
            <span v-else>Saindo...</span>
          </button>
        </div>
      </div>
    </header>

    <p v-if="signOutError" class="signout-error">{{ signOutError }}</p>

    <section class="container">
      <div class="quick">
        <NuxtLink to="/admin/reservations/open" class="quick-card">
          <div class="quick-icon" data-variant="sky">L</div>
          <div class="quick-text">
            <div class="quick-title">Nova locação</div>
            <div class="quick-sub">Abrir contrato para um cliente</div>
          </div>
        </NuxtLink>

        <NuxtLink to="/admin/items/form" class="quick-card">
          <div class="quick-icon" data-variant="emerald">+</div>
          <div class="quick-text">
            <div class="quick-title">Novo item</div>
            <div class="quick-sub">Cadastrar equipamento com imagem</div>
          </div>
        </NuxtLink>

        <NuxtLink to="/admin/clients/form" class="quick-card">
          <div class="quick-icon" data-variant="sky">C</div>
          <div class="quick-text">
            <div class="quick-title">Novo cliente</div>
            <div class="quick-sub">Cadastrar novo cliente</div>
          </div>
        </NuxtLink>
      </div>

      <div v-if="dataError" class="alert">
        {{ dataError }}
      </div>

      <div class="kpis">
        <div class="kpi">
          <div class="kpi-label">Itens disponiveis</div>
          <div class="kpi-value">{{ kpi.available }}</div>
          <div class="kpi-sub">prontos para locação</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">locações ativas</div>
          <div class="kpi-value">{{ kpi.active }}</div>
          <div class="kpi-sub">em andamento</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">Atrasos</div>
          <div class="kpi-value" :class="{ danger: kpi.late > 0 }">
            {{ kpi.late }}
          </div>
          <div class="kpi-sub">devoluções vencidas</div>
        </div>
      </div>

      <div class="lists">
        <div class="card">
          <div class="card-head">
            <h2>locações ativas</h2>
            <NuxtLink to="/admin/reservations/open" class="link"
              >abrir locação</NuxtLink
            >
          </div>

          <div v-if="dashboardLoading" class="empty">Carregando dados...</div>
          <div v-else-if="activeRentals.length === 0" class="empty">
            Nenhuma locação ativa no momento.
          </div>

          <ul v-else class="list">
            <li v-for="r in activeRentals" :key="r.id" class="row">
              <div class="row-main">
                <div class="row-title">{{ r.itemName }}</div>
                <div class="row-sub">Locatário: {{ r.lessee }}</div>
              </div>
              <div class="row-side">
                <div class="row-dates">
                  {{ toShortDate(r.startDate) }} -
                  {{ toShortDate(r.expectedReturnDate) }}
                </div>
                <span
                  class="chip"
                  :class="{ warn: isLate(r.expectedReturnDate) }"
                >
                  {{ isLate(r.expectedReturnDate) ? "Atrasado" : "No prazo" }}
                </span>
              </div>
            </li>
          </ul>
        </div>

        <div class="card" id="manutencao">
          <div class="card-head">
            <h2>Itens em manutenção</h2>
            <NuxtLink to="/admin/items/form" class="link">novo item</NuxtLink>
          </div>

          <div v-if="dashboardLoading" class="empty">Carregando dados...</div>
          <div v-else-if="maintenanceItems.length === 0" class="empty">
            Nenhum item em manutenção.
          </div>

          <ul v-else class="list">
            <li v-for="i in maintenanceItems" :key="i.id" class="row">
              <div class="row-main">
                <div class="row-title">{{ i.name }}</div>
                <div class="row-sub">
                  {{
                    i.category ? `Categoria: ${i.category}` : "Sem categoria"
                  }}
                </div>
              </div>
              <div class="row-side" v-if="i.imageUrl">
                <img :src="i.imageUrl" alt="" class="thumb" />
              </div>
            </li>
          </ul>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { onValue, ref as dbRef } from "firebase/database";
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { useFirebaseUser } from "@/composables/useFirebaseUser";
import { resetUserProfile } from "@/composables/useUserProfile";

type Unsubscribe = () => void;

const q = ref("");

const { user } = useFirebaseUser();
const userEmail = computed(() => user.value?.email ?? "user@aluga.ai");
const userName = computed(() => {
  if (user.value?.displayName) {
    return user.value.displayName;
  }
  return userEmail.value.split("@")[0].replace(/\W+/g, " ");
});
const userInitials = computed(() => {
  const name = userName.value?.trim();
  if (!name) {
    return "US";
  }
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  const first = parts[0].charAt(0).toUpperCase();
  const last = parts[parts.length - 1].charAt(0).toUpperCase();
  return `${first}${last}`;
});

const nuxtApp = useNuxtApp();
const firebase = nuxtApp.$firebase;
const signingOut = ref(false);
const signOutError = ref("");
const dataError = ref("");
const dashboardLoading = ref(true);

type Rental = {
  id: string;
  itemName: string;
  lessee: string;
  startDate: string;
  expectedReturnDate: string;
  status: "open" | "closed";
};
type Item = {
  id: string;
  name: string;
  category: string | null;
  status: "available" | "rented" | "maintenance";
  imageUrl: string | null;
};

const activeRentals = ref<Rental[]>([]);
const maintenanceItems = ref<Item[]>([]);
const kpi = reactive({ available: 0, active: 0, late: 0 });

const unsubscribers: Unsubscribe[] = [];
const loadedFlags = reactive({ rentals: false, items: false });

onMounted(() => {
  if (!firebase?.database) {
    dataError.value =
      "Firebase nao configurado. Defina as variaveis de ambiente para carregar o painel.";
    dashboardLoading.value = false;
    return;
  }

  const rentalsRef = dbRef(firebase.database, "rentals");
  const stopRentals = onValue(
    rentalsRef,
    (snapshot) => {
      const payload = snapshot.val() as Record<string, unknown> | null;
      const rentals = payload
        ? Object.entries(payload).map(([id, raw]) => {
            const data = (raw ?? {}) as Record<string, unknown>;
            return {
              id,
              itemName: String(data.itemName ?? "Sem nome"),
              lessee: String(data.lessee ?? "nao informado"),
              startDate: toIso(data.startDate) ?? new Date().toISOString(),
              expectedReturnDate:
                toIso(data.expectedReturnDate) ?? new Date().toISOString(),
              status:
                data.status === "closed" || data.status === "open"
                  ? (data.status as "open" | "closed")
                  : "open",
            };
          })
        : [];
      activeRentals.value = rentals
        .filter((entry) => entry.status === "open")
        .sort(
          (a, b) =>
            new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        );
      kpi.active = activeRentals.value.length;
      kpi.late = activeRentals.value.filter((r) =>
        isLate(r.expectedReturnDate)
      ).length;
      loadedFlags.rentals = true;
      if (loadedFlags.items) {
        dashboardLoading.value = false;
      }
    },
    (error) => {
      console.error("[home] rentals listener error:", error);
      dataError.value = "Erro ao carregar locacoes. Tente atualizar a pagina.";
      dashboardLoading.value = false;
    }
  );
  unsubscribers.push(stopRentals);

  const itemsRef = dbRef(firebase.database, "items");
  const stopItems = onValue(
    itemsRef,
    (snapshot) => {
      const payload = snapshot.val() as Record<string, unknown> | null;
      const items = payload
        ? Object.entries(payload).map(([id, raw]) => {
            const data = (raw ?? {}) as Record<string, unknown>;
            const status =
              data.status === "available" ||
              data.status === "rented" ||
              data.status === "maintenance"
                ? (data.status as Item["status"])
                : "available";
            return {
              id,
              name: String(data.name ?? "Sem nome"),
              category: data.category ? String(data.category) : null,
              status,
              imageUrl: data.imageUrl ? String(data.imageUrl) : null,
            };
          })
        : [];
      maintenanceItems.value = items.filter(
        (item) => item.status === "maintenance"
      );
      kpi.available = items.filter((item) => item.status === "available").length;
      kpi.late = activeRentals.value.filter((r) =>
        isLate(r.expectedReturnDate)
      ).length;
      loadedFlags.items = true;
      if (loadedFlags.rentals) {
        dashboardLoading.value = false;
      }
    },
    (error) => {
      console.error("[home] items listener error:", error);
      dataError.value = "Erro ao carregar os itens. Tente atualizar a pagina.";
      dashboardLoading.value = false;
    }
  );
  unsubscribers.push(stopItems);
});

onBeforeUnmount(() => {
  unsubscribers.forEach((stop) => stop());
});

async function logout() {
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
    console.error("[home] signOut error:", error);
    signOutError.value =
      "Nao foi possivel encerrar a sessao. Tente novamente em instantes.";
  } finally {
    signingOut.value = false;
  }
}

function toShortDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "--/--/----";
  }
  return date.toLocaleDateString();
}

function isLate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() < Date.now();
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
.home-shell {
  position: relative;
  min-height: 100vh;
  background: linear-gradient(
    135deg,
    rgba(226, 232, 240, 0.95),
    rgba(248, 250, 252, 0.95)
  );
  overflow-x: hidden;
  color: #0f172a;
  font-family: "Roboto", ui-sans-serif, system-ui, -apple-system, Segoe UI,
    Helvetica, Arial;
}

.bg-decor {
  position: absolute;
  inset: 0;
  background: radial-gradient(
      circle at 20% 20%,
      rgba(59, 130, 246, 0.18),
      transparent 55%
    ),
    radial-gradient(circle at 80% 0%, rgba(14, 165, 233, 0.14), transparent 65%);
  pointer-events: none;
  z-index: 0;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px clamp(16px, 6vw, 64px);
}
.brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
}
.mark {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: linear-gradient(135deg, #2563eb, #38bdf8);
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 20px;
  font-weight: 800;
}
.brand-txt .title {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.35px;
}
.brand-txt .subtitle {
  font-size: 14px;
  color: rgba(15, 23, 42, 0.7);
  letter-spacing: 0.2px;
}

.tools {
  display: flex;
  align-items: center;
  gap: 24px;
}
.search {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.4);
  min-width: 260px;
}
.search input {
  border: 0;
  background: transparent;
  outline: none;
  font-size: 16px;
  width: 100%;
}
.kbd {
  font-size: 12px;
  font-weight: 600;
  color: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.5);
  padding: 4px 8px;
  border-radius: 8px;
}

.user {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
}
.hello {
  color: rgba(15, 23, 42, 0.9);
}
.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(37, 99, 235, 0.18);
  border: 0;
  display: grid;
  place-items: center;
  font-weight: 700;
  letter-spacing: 0.4px;
  color: #1d4ed8;
}

.container {
  position: relative;
  z-index: 1;
  padding: clamp(32px, 8vw, 72px) clamp(16px, 6vw, 64px) 80px;
  display: grid;
  gap: 28px;
}

.quick {
  display: grid;
  gap: 16px;
}
@media (min-width: 900px) {
  .quick {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
.quick-card {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.85);
  border-radius: 22px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
  text-decoration: none;
  color: inherit;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.quick-card::after {
  content: "";
  position: absolute;
  inset: auto auto -45px 60%;
  width: 120px;
  height: 120px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.25), transparent);
  transform: rotate(25deg);
}
.quick-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 28px 48px rgba(15, 23, 42, 0.12);
}
.quick-icon {
  width: 60px;
  height: 60px;
  border-radius: 18px;
  display: grid;
  place-items: center;
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
}
.quick-icon[data-variant="sky"] {
  background: rgba(59, 130, 246, 0.18);
}
.quick-icon[data-variant="emerald"] {
  background: rgba(16, 185, 129, 0.16);
}
.quick-text .quick-title {
  font-size: 20px;
  font-weight: 700;
}
.quick-text .quick-sub {
  color: rgba(15, 23, 42, 0.65);
  font-size: 15px;
}

.alert {
  padding: 14px 18px;
  border-radius: 12px;
  background: rgba(248, 113, 113, 0.14);
  color: #b91c1c;
  border: 1px solid rgba(248, 113, 113, 0.4);
}

.kpis {
  display: grid;
  gap: 16px;
}
@media (min-width: 900px) {
  .kpis {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
.kpi {
  padding: 24px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(148, 163, 184, 0.35);
  box-shadow: 0 18px 50px rgba(15, 23, 42, 0.06);
}
.kpi-label {
  font-size: 16px;
  color: rgba(15, 23, 42, 0.65);
}
.kpi-value {
  margin-top: 4px;
  font: 800 24px/1 ui-sans-serif, system-ui;
  letter-spacing: 0.2px;
}
.kpi-value.danger {
  color: #e11d48;
}
.kpi-sub {
  margin-top: 4px;
  font-size: 12px;
  color: rgba(15, 23, 42, 0.6);
}

.lists {
  display: grid;
  gap: 20px;
  grid-template-columns: 1fr;
}
@media (min-width: 1024px) {
  .lists {
    grid-template-columns: 1fr 1fr;
  }
}

.card {
  padding: 24px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.35);
  box-shadow: 0 20px 48px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(10px);
}
.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.card-head h2 {
  font: 600 20px "Roboto", sans-serif;
}
.link {
  font: 16px "Roboto", sans-serif;
  color: #2563eb;
  text-decoration: none;
}
.link:hover {
  color: #1d4ed8;
}

.empty {
  text-align: center;
  color: #64748b;
  font: 18px "Roboto", sans-serif;
  padding: 24px;
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  border-top: 1px solid rgba(226, 232, 240, 0.8);
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
}
.row:last-child {
  border-bottom: none;
}
.row-main {
  min-width: 0;
}
.row-title {
  font: 600 20px "Roboto", sans-serif;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.row-sub {
  font: 16px "Roboto", sans-serif;
  color: rgba(15, 23, 42, 0.6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.row-side {
  text-align: right;
  display: grid;
  gap: 8px;
  justify-items: end;
}
.row-dates {
  font: 14px "Roboto", sans-serif;
  color: rgba(15, 23, 42, 0.6);
}

.thumb {
  width: 60px;
  height: 60px;
  border-radius: 14px;
  object-fit: cover;
  border: 1px solid rgba(148, 163, 184, 0.4);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  padding: 8px 12px;
  font: 700 16px "Roboto", sans-serif;
  cursor: pointer;
  border: 1px solid transparent;
  background: #fff;
  color: #0f172a;
  transition: background 0.15s ease, opacity 0.15s ease;
}
.btn-outline {
  border-color: #e2e8f0;
}
.btn-outline:hover {
  background: #f8fafc;
}
.btn-sm {
  padding: 6px 10px;
  font-size: 11px;
}

.chip {
  display: inline-block;
  border-radius: 999px;
  padding: 3px 8px;
  font: 700 12px "Roboto", sans-serif;
  background: rgba(34, 197, 94, 0.18);
  color: #15803d;
}
.chip.warn {
  background: rgba(248, 113, 113, 0.18);
  color: #b91c1c;
}

.signout-error {
  color: #b91c1c;
  background: rgba(248, 113, 113, 0.12);
  border: 1px solid rgba(248, 113, 113, 0.4);
  margin: 0 clamp(16px, 6vw, 64px);
  padding: 12px 16px;
  border-radius: 12px;
}
</style>

