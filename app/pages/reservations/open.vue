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
  navigateTo("/");
}
</script>

<template>
  <div class="mx-auto max-w-2xl px-4 py-8">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <p class="text-xs text-slate-500">Reservations</p>
        <h1 class="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
          Open rental
        </h1>
      </div>
      <NuxtLink
        to="/reservations"
        class="text-sm text-slate-500 underline underline-offset-4 hover:text-slate-700"
        >all rentals</NuxtLink
      >
    </div>

    <Card class="bg-white/80 backdrop-blur">
      <CardHeader>
        <CardTitle>Rental form</CardTitle>
      </CardHeader>

      <form @submit.prevent="submit">
        <CardContent class="space-y-4">
          <!-- cliente + item -->
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-1.5">
              <Label for="cliente">Client*</Label>
              <Input
                id="cliente"
                v-model="form.cliente"
                placeholder="Name or client ID"
                required
              />
            </div>
            <div class="space-y-1.5">
              <Label for="item">Item*</Label>
              <Input
                id="item"
                v-model="form.item"
                placeholder="Name or item ID"
                required
              />
            </div>
          </div>

          <!-- datas -->
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-1.5">
              <Label for="inicio">Start*</Label>
              <Input
                id="inicio"
                v-model="form.inicio"
                type="datetime-local"
                required
              />
              <p class="text-xs text-slate-500">Pickup date/time.</p>
            </div>
            <div class="space-y-1.5">
              <Label for="fim">Expected return*</Label>
              <Input
                id="fim"
                v-model="form.fim"
                type="datetime-local"
                required
              />
              <p class="text-xs text-slate-500">Return date/time.</p>
            </div>
          </div>

          <!-- observações -->
          <div class="space-y-1.5">
            <Label for="obs">Notes</Label>
            <Textarea
              id="obs"
              v-model="form.observacoes"
              rows="3"
              placeholder="Internal notes, conditions, accessories, etc."
            />
          </div>
        </CardContent>

        <CardFooter class="flex flex-col gap-2 sm:flex-row">
          <Button type="submit" class="sm:order-none order-1"
            >Open rental</Button
          >
          <NuxtLink
            to="/"
            class="inline-flex h-9 items-center justify-center rounded-md border px-4 text-sm font-medium hover:bg-slate-50"
          >
            Cancel
          </NuxtLink>
        </CardFooter>
      </form>
    </Card>

    <p class="mt-4 text-xs text-slate-500">
      * Required fields. Conflicts will be validated on save.
    </p>
  </div>
</template>
