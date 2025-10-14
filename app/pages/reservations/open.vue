<script setup lang="ts">
import { reactive } from "vue";

const form = reactive({
  cliente: "",
  item: "",
  inicio: "",
  fim: "",
  observacoes: "",
});

function submit() {
  if (!form.cliente || !form.item || !form.inicio || !form.fim) return;
  console.log("[locações] abrir", form);
  navigateTo("/home"); // ajuste o destino quando tiver a lista
}
</script>

<template>
  <main class="form-container">
    <section class="card">
      <header class="mb-4">
        <p class="caption muted">Reservas</p>
        <h1 class="h1">Abrir locação</h1>
      </header>

      <form @submit.prevent="submit" class="form-vertical" novalidate>
        <!-- Cliente + Item -->
        <div class="row">
          <div class="col">
            <label class="label">Cliente*</label>
            <input
              v-model.trim="form.cliente"
              required
              class="input"
              placeholder="Nome ou ID do cliente"
            />
          </div>
          <div class="col">
            <label class="label">Item*</label>
            <input
              v-model.trim="form.item"
              required
              class="input"
              placeholder="Nome ou ID do item"
            />
          </div>
        </div>

        <!-- Início + Fim previsto -->
        <div class="row">
          <div class="col">
            <label class="label">Início*</label>
            <input
              v-model="form.inicio"
              type="datetime-local"
              required
              class="input"
            />
            <p class="hint">Data/hora prevista de retirada.</p>
          </div>
          <div class="col">
            <label class="label">Fim previsto*</label>
            <input
              v-model="form.fim"
              type="datetime-local"
              required
              class="input"
            />
            <p class="hint">Data/hora prevista de devolução.</p>
          </div>
        </div>

        <!-- Observações -->
        <div class="field">
          <label class="label">Observações</label>
          <textarea
            v-model.trim="form.observacoes"
            rows="3"
            class="input"
            placeholder="Notas internas, condições, acessórios entregues…"
          ></textarea>
        </div>

        <!-- Ações -->
        <div class="actions">
          <button type="submit" class="btn btn-primary">Abrir locação</button>
          <NuxtLink to="/home" class="btn btn-outline">Cancelar</NuxtLink>
        </div>
      </form>
    </section>
  </main>
</template>

<style scoped>
/* ===== layout base (coerente com login/cliente/item) ===== */
.form-container {
  min-height: 40dvh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 24px;
  font-family: "Roboto", ui-sans-serif, system-ui, -apple-system, Segoe UI,
    Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
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

/* ===== tipografia utilitária ===== */
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

/* ===== formulário em flex ===== */
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

/* ===== inputs (mesmo padrão) ===== */
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

/* ===== ações ===== */
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding-top: 8px;
}

/* ===== botões ===== */
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
</style>
