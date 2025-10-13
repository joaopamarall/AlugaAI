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
  // TODO: integrar backend/store
  console.log("[itens] criar", form);
  navigateTo("/"); // ou navigateTo('/itens/lista') quando existir
}
</script>

<template>
  <div class="max-w-2xl mx-auto p-6">
    <h1 class="text-2xl font-semibold mb-4">Novo item</h1>

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
          placeholder="Ex.: Furadeira Bosch GSB 13"
        />
      </div>

      <div class="grid sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm mb-1">Código</label>
          <input
            v-model="form.codigo"
            class="w-full border rounded-xl px-3 py-2"
            placeholder="EQ-001"
          />
        </div>
        <div>
          <label class="block text-sm mb-1">Categoria</label>
          <input
            v-model="form.categoria"
            class="w-full border rounded-xl px-3 py-2"
            placeholder="Ex.: Perfuração"
          />
        </div>
      </div>

      <div>
        <label class="block text-sm mb-1">Status</label>
        <select
          v-model="form.status"
          class="w-full border rounded-xl px-3 py-2"
        >
          <option value="available">Disponível</option>
          <option value="rented">Alugado</option>
          <option value="maintenance">Manutenção</option>
        </select>
      </div>

      <div>
        <label class="block text-sm mb-1">Descrição</label>
        <textarea
          v-model="form.descricao"
          rows="3"
          class="w-full border rounded-xl px-3 py-2"
          placeholder="Detalhes, potência, voltagem, acessórios..."
        ></textarea>
      </div>

      <div class="flex gap-2 pt-2">
        <button class="px-4 py-2 rounded-xl bg-black text-white">Salvar</button>
        <NuxtLink to="/" class="px-4 py-2 rounded-xl border">Cancelar</NuxtLink>
      </div>
    </form>
  </div>
</template>
