<script setup lang="ts">
import { reactive } from "vue";

const form = reactive({
  nome: "",
  codigo: "",
  categoria: "",
  status: "available",
  descricao: "",
});

function submit() {
  if (!form.nome) return;
  console.log("[itens] criar", form);
  navigateTo("/home"); // ou /items/lista quando existir
}
</script>

<template>
  <main class="form-container">
    <section class="card">
      <header class="mb-4">
        <h1 class="h1">Novo item</h1>
      </header>

      <form @submit.prevent="submit" class="form-vertical" novalidate>
        <div class="field">
          <label class="label">Nome*</label>
          <input
            v-model.trim="form.nome"
            required
            class="input"
            placeholder="Ex.: Furadeira Bosch GSB 13"
          />
        </div>

        <div class="row">
          <div class="col">
            <label class="label">Código</label>
            <input
              v-model.trim="form.codigo"
              class="input"
              placeholder="EQ-001"
            />
          </div>
          <div class="col">
            <label class="label">Categoria</label>
            <input
              v-model.trim="form.categoria"
              class="input"
              placeholder="Ex.: Perfuração"
            />
          </div>
        </div>

        <div class="field">
          <label class="label">Status</label>
          <select v-model="form.status" class="input select-reset">
            <option value="available">Disponível</option>
            <option value="rented">Alugado</option>
            <option value="maintenance">Manutenção</option>
          </select>
        </div>

        <div class="field">
          <label class="label">Descrição</label>
          <textarea
            v-model.trim="form.descricao"
            rows="3"
            class="input"
            placeholder="Detalhes, potência, voltagem, acessórios..."
          ></textarea>
        </div>

        <div class="actions">
          <button type="submit" class="btn btn-primary">Salvar</button>
          <NuxtLink to="/home" class="btn btn-outline">Cancelar</NuxtLink>
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

.h1 {
  font-size: 24px;
  line-height: 1.2;
  font-weight: 700;
  letter-spacing: 0.2px;
  margin-top: 2px;
}
.label {
  font-size: 14px;
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
  transition: border 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
  outline: none;
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
</style>
