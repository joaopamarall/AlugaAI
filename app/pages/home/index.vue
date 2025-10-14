<template>
  <main class="home-shell">
    <!-- fundo sutil -->
    <div class="bg-decor"></div>

    <!-- Header -->
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
            placeholder="Buscar itens, clientes, locações…"
          />
          <span class="kbd">⌘K</span>
        </div>
        <div class="user">
          <span class="hello"
            >Olá, <b>{{ userName }}</b></span
          >
          <button class="avatar" :title="userEmail">{{ userInitials }}</button>
        </div>
      </div>
    </header>

    <!-- Conteúdo -->
    <section class="container">
      <!-- Ações rápidas -->
      <div class="quick">
        <NuxtLink to="/reservations/open" class="quick-card">
          <div class="quick-icon" data-variant="sky">➕</div>
          <div class="quick-text">
            <div class="quick-title">Nova locação</div>
            <div class="quick-sub">Abrir contrato para um cliente</div>
          </div>
        </NuxtLink>

        <NuxtLink to="/items/form" class="quick-card">
          <div class="quick-icon" data-variant="emerald">📦</div>
          <div class="quick-text">
            <div class="quick-title">Novo item</div>
            <div class="quick-sub">Cadastrar ferramenta/equipamento</div>
          </div>
        </NuxtLink>

        <NuxtLink to="/clients/form" class="quick-card">
          <div class="quick-icon" data-variant="indigo">👤</div>
          <div class="quick-text">
            <div class="quick-title">Novo cliente</div>
            <div class="quick-sub">Cadastrar dados básicos</div>
          </div>
        </NuxtLink>
      </div>

      <!-- KPIs -->
      <div class="kpis">
        <div class="kpi">
          <div class="kpi-label">Itens disponíveis</div>
          <div class="kpi-value">{{ kpi.available }}</div>
          <div class="kpi-sub">prontos para locação</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">Locações ativas</div>
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

      <!-- Listas -->
      <div class="lists">
        <!-- Locações ativas -->
        <div class="card">
          <div class="card-head">
            <h2>Locações ativas</h2>
            <NuxtLink to="/locacoes/lista" class="link">ver todas</NuxtLink>
          </div>

          <div v-if="activeRentals.length === 0" class="empty">
            Nenhuma locação ativa no momento.
          </div>

          <ul v-else class="list">
            <li v-for="r in activeRentals" :key="r.id" class="row">
              <div class="row-main">
                <div class="row-title">{{ r.itemName }}</div>
                <div class="row-sub">Cliente: {{ r.clientName }}</div>
              </div>
              <div class="row-side">
                <div class="row-dates">
                  {{ toShortDate(r.startDate) }} →
                  {{ toShortDate(r.expectedReturnDate) }}
                </div>
                <NuxtLink
                  :to="`/locacoes/devolver?id=${r.id}`"
                  class="btn btn-outline btn-sm"
                  >Devolver</NuxtLink
                >
              </div>
            </li>
          </ul>
        </div>

        <!-- Itens em manutenção -->
        <div class="card">
          <div class="card-head">
            <h2>Itens em manutenção</h2>
            <NuxtLink to="/itens/lista" class="link">ver itens</NuxtLink>
          </div>

          <div v-if="maintenanceItems.length === 0" class="empty">
            Nenhum item em manutenção.
          </div>

          <ul v-else class="list">
            <li v-for="i in maintenanceItems" :key="i.id" class="row">
              <div class="row-main">
                <div class="row-title">{{ i.name }}</div>
                <div class="row-sub">Categoria: {{ i.category }}</div>
              </div>
              <span class="chip warn">maintenance</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from "vue";

const q = ref("");

// Usuário a partir do localStorage (mesma ideia do login)
const userEmail = computed(() => {
  if (process.client) {
    try {
      return (
        JSON.parse(localStorage.getItem("alugaai:user") || "{}")?.email ||
        "user@aluga.ai"
      );
    } catch {
      return "user@aluga.ai";
    }
  }
  return "user@aluga.ai";
});
const userName = computed(() =>
  userEmail.value.split("@")[0].replace(/\W+/g, " ")
);
const userInitials = computed(
  () => userName.value?.slice(0, 2).toUpperCase() || "US"
);

// Tipos simples
type Rental = {
  id: string;
  itemName: string;
  clientName: string;
  startDate: string;
  expectedReturnDate: string;
  status: "open" | "closed";
};
type Item = {
  id: string;
  name: string;
  category: string;
  status: "available" | "rented" | "maintenance";
};

// Estado (mock para visual). Troque pelo seu storage (ex.: useDb) quando quiser.
const activeRentals = ref<Rental[]>([]);
const maintenanceItems = ref<Item[]>([]);
const kpi = reactive({ available: 0, active: 0, late: 0 });

onMounted(() => {
  const now = new Date();
  const twoDays = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  activeRentals.value = [
    {
      id: "r-1",
      itemName: "Furadeira Bosch GSB 13 RE",
      clientName: "João Cliente",
      startDate: now.toISOString(),
      expectedReturnDate: twoDays.toISOString(),
      status: "open",
    },
  ];
  maintenanceItems.value = [
    {
      id: "i-1",
      name: "Betoneira 120L",
      category: "Concreto",
      status: "maintenance",
    },
  ];
  kpi.available = 12;
  kpi.active = activeRentals.value.length;
  kpi.late = 0;
});

function toShortDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}
</script>

<style scoped>
/* =============  Tokens locais (light)  ============= */
.home-shell {
  --bg: #f8f9fb;
  --text: #121926;
  --muted: #65748b;
  --surface: #ffffff;
  --surface-2: #f5f7fa;
  --stroke: #e2e8f0;
  --shadow: 9, 17, 34;

  --brand: #2196f3;
  --brand-strong: #1565c0;

  --warn-bg: #fffbeb;
  --warn-fg: #92400e;

  background: var(--bg);
  color: var(--text);
  min-height: 100dvh;
  position: relative;
}

/* fundo sutil */
.bg-decor {
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  filter: blur(40px);
  background: radial-gradient(
      60rem 40rem at 10% -10%,
      rgba(33, 150, 243, 0.12),
      transparent 60%
    ),
    radial-gradient(
      40rem 30rem at 120% 10%,
      rgba(21, 101, 192, 0.1),
      transparent 55%
    ),
    radial-gradient(
      36rem 28rem at 50% 120%,
      rgba(16, 185, 129, 0.08),
      transparent 60%
    );
}

/* ===== Header ===== */
.topbar {
  position: sticky;
  top: 0;
  z-index: 5;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--stroke);
}
.topbar > .brand,
.topbar > .tools {
  display: flex;
  align-items: center;
  gap: 12px;
}
.topbar > .brand {
  padding: 12px 16px;
}
.topbar .mark {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid var(--stroke);
  font-size: 18px;
}
.brand-txt .title {
  font: 600 16px "Roboto", sans-serif;
}
.brand-txt .subtitle {
  font: 12px "Roboto", sans-serif;
  color: var(--muted);
  margin-top: 2px;
}

.topbar .tools {
  margin-left: auto;
  padding: 12px 16px;
}
.search {
  position: relative;
  display: none;
}
@media (min-width: 640px) {
  .search {
    display: block;
  }
}
.search input {
  width: 22rem;
  border-radius: 12px;
  border: 1px solid var(--stroke);
  background: #fff;
  padding: 10px 36px 10px 14px;
  outline: none;
  transition: border 0.15s ease, box-shadow 0.15s ease;
  font-size: 14px;
}
.search input::placeholder {
  color: #94a3b8;
}
.search input:focus {
  border-color: var(--brand);
  box-shadow: 0 0 0 6px rgba(33, 150, 243, 0.16);
}
.kbd {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  font-size: 12px;
}

.user {
  display: flex;
  align-items: center;
  gap: 10px;
}
.user .hello {
  display: none;
  font-size: 13px;
  color: #475569;
}
@media (min-width: 640px) {
  .user .hello {
    display: block;
  }
}
.avatar {
  height: 36px;
  width: 36px;
  border-radius: 999px;
  background: #e5e7eb;
  color: #334155;
  font-weight: 700;
  border: none;
  cursor: default;
}

/* ===== Container e Cards ===== */
.container {
  margin: 0 auto;
  max-width: 1100px;
  padding: 24px 16px;
  display: grid;
  gap: 20px;
}
.card {
  background: var(--surface);
  border: 1px solid var(--stroke);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 10px 30px rgba(var(--shadow), 0.06),
    0 2px 8px rgba(var(--shadow), 0.04);
}

/* Ações rápidas */
.quick {
  display: grid;
  gap: 12px;
  grid-template-columns: 1fr;
}
@media (min-width: 640px) {
  .quick {
    grid-template-columns: repeat(3, 1fr);
  }
}
.quick-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--surface);
  border: 1px solid var(--stroke);
  border-radius: 16px;
  padding: 14px;
  text-decoration: none;
  color: inherit;
  box-shadow: 0 8px 18px rgba(var(--shadow), 0.04);
  transition: box-shadow 0.15s ease, transform 0.12s ease;
}
.quick-card:hover {
  box-shadow: 0 16px 26px rgba(var(--shadow), 0.08);
  transform: translateY(-1px);
}

.quick-icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: #eaf3ff;
  color: #0b64b0;
  font-size: 18px;
  flex-shrink: 0;
}
.quick-icon[data-variant="emerald"] {
  background: #e8fff5;
  color: #047857;
}
.quick-icon[data-variant="indigo"] {
  background: #eef2ff;
  color: #4338ca;
}

.quick-title {
  font: 600 14px/1.2 ui-sans-serif, system-ui;
}
.quick-sub {
  font: 12px/1.2 ui-sans-serif;
  color: var(--muted);
}

/* KPIs */
.kpis {
  display: grid;
  gap: 12px;
  grid-template-columns: 1fr;
}
@media (min-width: 640px) {
  .kpis {
    grid-template-columns: repeat(3, 1fr);
  }
}
.kpi {
  background: var(--surface);
  border: 1px solid var(--stroke);
  border-radius: 16px;
  padding: 14px;
  box-shadow: 0 8px 18px rgba(var(--shadow), 0.04);
}
.kpi-label {
  font: 20px "Roboto", sans-serif;
  color: var(--muted);
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
  font: 12px "Roboto", sans-serif;
  color: var(--muted);
}

/* Listas (duas colunas) */
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
  color: var(--brand);
  text-decoration: none;
}
.link:hover {
  color: var(--brand-strong);
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
  border-top: 1px solid var(--stroke);
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--stroke);
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
  color: var(--muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.row-side {
  text-align: right;
}
.row-dates {
  font: 14px "Roboto", sans-serif;
  color: var(--muted);
}

/* Botões e chips */
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
}
.chip.warn {
  background: var(--warn-bg);
  color: var(--warn-fg);
}
</style>
