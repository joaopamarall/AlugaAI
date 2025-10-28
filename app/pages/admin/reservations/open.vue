<script setup lang="ts">
import {
  equalTo,
  get,
  orderByChild,
  push,
  query,
  ref as dbRef,
  set,
  update,
} from "firebase/database";
import { computed, onMounted, reactive, ref } from "vue";

type ItemOption = {
  id: string;
  name: string;
  category: string | null;
  imageUrl: string | null;
};

const form = reactive({
  locatario: "",
  itemId: "",
  inicio: "",
  fim: "",
  observacoes: "",
});

const nuxtApp = useNuxtApp();
const firebase = nuxtApp.$firebase;
const items = ref<ItemOption[]>([]);
const loadingItems = ref(false);
const loading = ref(false);
const errorMessage = ref("");

const hasFirebase = computed(() => Boolean(firebase?.database));
const canSubmit = computed(() => {
  if (!hasFirebase.value || loading.value) return false;
  return (
    form.locatario.trim().length > 2 &&
    form.itemId !== "" &&
    form.inicio !== "" &&
    form.fim !== ""
  );
});

onMounted(async () => {
  await fetchItems();
});

async function fetchItems() {
  errorMessage.value = "";
  if (!firebase?.database) {
    errorMessage.value =
      "Firebase nao configurado. Defina as variaveis de ambiente.";
    return;
  }
  loadingItems.value = true;
  try {
    const itemsRef = dbRef(firebase.database, "items");
    const availableQuery = query(
      itemsRef,
      orderByChild("status"),
      equalTo("available")
    );
    const snapshot = await get(availableQuery);
    const payload = snapshot.exists()
      ? (snapshot.val() as Record<string, unknown>)
      : null;

    items.value = payload
      ? Object.entries(payload).map(([id, raw]) => {
          const data = (raw ?? {}) as Record<string, unknown>;
          return {
            id,
            name: String(data.name ?? "Sem nome"),
            category: data.category ? String(data.category) : null,
            imageUrl: data.imageUrl ? String(data.imageUrl) : null,
          };
        })
      : [];
    items.value.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    if (!items.value.length) {
      errorMessage.value =
        "Nenhum item disponivel para locacao. Cadastre um item ou finalize uma locacao em aberto.";
    }
  } catch (error) {
    console.error("[reservations] fetch items error:", error);
    errorMessage.value =
      "Nao foi possivel carregar os itens disponiveis. Tente novamente.";
  } finally {
    loadingItems.value = false;
  }
}

async function submit() {
  errorMessage.value = "";
  if (!canSubmit.value) return;
  if (!firebase?.database) {
    errorMessage.value =
      "Firebase nao configurado. Defina as variaveis de ambiente.";
    return;
  }

  const item = items.value.find((entry) => entry.id === form.itemId);
  if (!item) {
    errorMessage.value = "Selecione um item valido.";
    return;
  }

  const start = new Date(form.inicio);
  const end = new Date(form.fim);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    errorMessage.value = "Informe datas validas.";
    return;
  }

  if (start >= end) {
    errorMessage.value =
      "A data de fim deve ser maior que a data de inicio da locacao.";
    return;
  }

  loading.value = true;
  try {
    const nowIso = new Date().toISOString();
    const rentalsRef = dbRef(firebase.database, "rentals");
    const rentalRef = push(rentalsRef);
    const rentalId = rentalRef.key;
    if (!rentalId) {
      throw new Error("Falha ao gerar identificador da locacao.");
    }

    await set(rentalRef, {
      id: rentalId,
      itemId: item.id,
      itemName: item.name,
      itemCategory: item.category,
      itemImageUrl: item.imageUrl,
      lessee: form.locatario.trim(),
      lesseeId: null,
      notes: form.observacoes.trim() || null,
      startDate: start.toISOString(),
      expectedReturnDate: end.toISOString(),
      status: "open",
      createdAt: nowIso,
      updatedAt: nowIso,
      createdBy: "admin",
    });

    await update(dbRef(firebase.database, `items/${item.id}`), {
      status: "rented",
      updatedAt: nowIso,
    });

    navigateTo("/admin/home");
  } catch (error) {
    console.error("[reservations] create error:", error);
    errorMessage.value =
      "Nao foi possivel abrir a locacao. Tente novamente em instantes.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <main class="form-container">
    <section class="card">
      <header class="mb-4">
        <p class="caption muted">Reservas</p>
        <h1 class="h1">Abrir locação</h1>
        <p class="muted caption">
          Defina o responsável, escolha o equipamento e configure o período.
        </p>
      </header>

      <form @submit.prevent="submit" class="form-vertical" novalidate>
        <div class="field">
          <label class="label">Nome do locatário*</label>
          <input
            v-model.trim="form.locatario"
            required
            class="input"
            placeholder="Nome do cliente ou empresa"
          />
        </div>

        <div class="field">
          <label class="label">Equipamento*</label>
          <select
            v-model="form.itemId"
            class="input select-reset"
            :disabled="loadingItems"
          >
            <option value="" disabled>
              {{ loadingItems ? "Carregando itens..." : "Selecione um item" }}
            </option>
            <option v-for="item in items" :key="item.id" :value="item.id">
              {{ item.name }}
              <template v-if="item.category"> - {{ item.category }}</template>
            </option>
          </select>
          <button
            type="button"
            class="btn btn-outline btn-sm"
            :disabled="loadingItems"
            @click="fetchItems"
          >
            Atualizar lista
          </button>
        </div>

        <div class="row">
          <div class="col">
            <label class="label">Início*</label>
            <input
              v-model="form.inicio"
              type="datetime-local"
              required
              class="input"
            />
            <p class="hint">Data e hora previstas de retirada.</p>
          </div>
          <div class="col">
            <label class="label">Fim previsto*</label>
            <input
              v-model="form.fim"
              type="datetime-local"
              required
              class="input"
            />
            <p class="hint">Data e hora previstas de devolução.</p>
          </div>
        </div>

        <div class="field">
          <label class="label">Observações</label>
          <textarea
            v-model.trim="form.observacoes"
            rows="3"
            class="input"
            placeholder="Notas internas, condições, acessórios entregues..."
          ></textarea>
        </div>

        <p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>

        <div class="actions">
          <button type="submit" class="btn btn-primary" :disabled="!canSubmit">
            <span v-if="!loading">Abrir locação</span>
            <span v-else>Salvando...</span>
          </button>
          <NuxtLink to="/admin/home" class="btn btn-outline">Cancelar</NuxtLink>
        </div>
      </form>
    </section>
  </main>
</template>

<style scoped>
.form-container {
  min-height: 40dvh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 24px;
  font-family: "Roboto", ui-sans-serif, system-ui, -apple-system, Segoe UI,
    Helvetica, Arial;
}
.card {
  width: 100%;
  border-radius: 16px;
  padding: 40px;
  background: rgb(var(--surface));
  border: 1px solid rgb(var(--stroke));
  box-shadow: 0 10px 30px rgba(var(--shadow), 0.06),
    0 2px 8px rgba(var(--shadow), 0.04);
  backdrop-filter: blur(var(--blur, 8px));
}

.muted {
  color: rgb(var(--muted));
}
.h1 {
  font-size: 24px;
  line-height: 1.2;
  font-weight: 700;
  letter-spacing: 0.2px;
  margin-top: 2px;
}
.caption {
  font-size: 14px;
}
.label {
  font-size: 14px;
  color: rgb(var(--muted));
}
.hint {
  margin-top: 0;
  margin-left: 4px;
  font-size: 12px;
  color: rgb(var(--muted));
}

.form-vertical {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.row {
  display: flex;
  flex-direction: column;
  gap: 40px;
}
.col {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
@media (min-width: 640px) {
  .row {
    flex-direction: row;
  }
  .col {
    flex: 1 1 0;
    min-width: 0;
  }
}

.input {
  width: 100%;
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
  box-shadow: 0 0 0 6px rgba(var(--focus-ring, 33, 150, 243), 0.14);
}

.select-reset {
  appearance: none;
  background-image: linear-gradient(
      45deg,
      transparent 50%,
      rgb(var(--muted)) 50%
    ),
    linear-gradient(135deg, rgb(var(--muted)) 50%, transparent 50%),
    linear-gradient(to right, transparent, transparent);
  background-position: calc(100% - 18px) calc(50% - 4px),
    calc(100% - 12px) calc(50% - 4px), 100% 0;
  background-size: 6px 6px, 6px 6px, 2.5em 2.5em;
  background-repeat: no-repeat;
  padding-right: 44px;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding-top: 8px;
}

.btn {
  display: inline-flex;
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
  color: #fff;
  background: rgb(var(--brand));
  border-color: rgb(var(--brand));
  box-shadow: 0 8px 20px rgba(var(--brand), 0.25);
}
.btn-primary:hover {
  background: rgb(var(--brand-strong));
  border-color: rgb(var(--brand-strong));
}

.btn-outline {
  color: rgb(var(--text));
  background: #fff;
  border-color: rgb(var(--stroke));
}
.btn-outline:hover {
  background: rgb(var(--surface-2));
}

.btn-sm {
  padding: 6px 10px;
  font-size: 11px;
  align-self: flex-start;
}

.error-msg {
  color: rgb(220, 38, 38);
  font-size: 14px;
}
</style>

