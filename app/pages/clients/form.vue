<script setup lang="ts">
import { reactive } from "vue";
const form = reactive({
  nome: "",
  email: "",
  telefone: "",
  documento: "",
  endereco: "",
});

function submit() {
  if (!form.nome || !form.email || !form.documento) return;
  console.log("[clientes] criar", form);
  navigateTo("/home");
}
</script>

<template>
  <main class="form-container">
    <section class="card">
      <header class="mb-4">
        <h1 class="h1">Novo cliente</h1>
      </header>

      <form @submit.prevent="submit" class="form-vertical" novalidate>
        <div class="field">
          <label class="label">Nome*</label>
          <input
            v-model.trim="form.nome"
            required
            class="input"
            placeholder="Ex.: João Silva"
          />
        </div>

        <div class="row">
          <div class="col">
            <label class="label">E-mail*</label>
            <input
              v-model.trim="form.email"
              type="email"
              inputmode="email"
              autocomplete="email"
              required
              class="input"
              placeholder="email@exemplo.com"
            />
          </div>
          <div class="col">
            <label class="label">Telefone</label>
            <input
              v-model.trim="form.telefone"
              class="input"
              placeholder="(00) 90000-0000"
            />
          </div>
        </div>

        <div class="row">
          <div class="col">
            <label class="label">CPF/CNPJ*</label>
            <input
              v-model.trim="form.documento"
              class="input"
              placeholder="000.000.000-00"
            />
          </div>
          <div class="col">
            <label class="label">Endereço</label>
            <input
              v-model.trim="form.endereco"
              class="input"
              placeholder="Rua, nº, bairro"
            />
          </div>
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
.label {
  font-size: 14px;
  color: rgb(var(--muted));
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
  padding: 12px 0 12px 12px;
  color: rgb(var(--text));
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
