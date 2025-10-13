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
  // TODO: integrar backend/store
  console.log("[clientes] criar", form);
  navigateTo("/"); // ou navigateTo('/clientes/lista') quando existir
}
</script>

<template>
  <div class="max-w-2xl mx-auto p-6">
    <h1 class="text-2xl font-semibold mb-4">Novo cliente</h1>

    <form
      @submit.prevent="submit"
      class="space-y-4 bg-white border rounded-2xl p-4"
    >
      <div>
        <label class="block text-sm mb-1">Nome*</label>
        <input
          v-model="form.nome"
          required
          class="w-full border rounded-xl px-3 py-2"
          placeholder="Ex.: João Silva"
        />
      </div>

      <div class="grid sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm mb-1">E-mail*</label>
          <input
            v-model="form.email"
            type="email"
            required
            class="w-full border rounded-xl px-3 py-2"
            placeholder="email@exemplo.com"
          />
        </div>
        <div>
          <label class="block text-sm mb-1">Telefone</label>
          <input
            v-model="form.telefone"
            class="w-full border rounded-xl px-3 py-2"
            placeholder="(00) 90000-0000"
          />
        </div>
      </div>

      <div class="grid sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm mb-1">CPF/CNPJ</label>
          <input
            v-model="form.documento"
            class="w-full border rounded-xl px-3 py-2"
            placeholder="000.000.000-00"
          />
        </div>
        <div>
          <label class="block text-sm mb-1">Endereço</label>
          <input
            v-model="form.endereco"
            class="w-full border rounded-xl px-3 py-2"
            placeholder="Rua, nº, bairro"
          />
        </div>
      </div>

      <div class="flex gap-2 pt-2">
        <button class="px-4 py-2 rounded-xl bg-black text-white">Salvar</button>
        <NuxtLink to="/" class="px-4 py-2 rounded-xl border">Cancelar</NuxtLink>
      </div>
    </form>
  </div>
</template>
