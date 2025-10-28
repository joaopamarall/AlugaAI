<script setup lang="ts">
import { push, ref as dbRef, set } from "firebase/database";
import {
  getDownloadURL,
  ref as storageRef,
  uploadBytes,
} from "firebase/storage";
import { computed, onBeforeUnmount, reactive, ref, watchEffect } from "vue";

const form = reactive({
  nome: "",
  codigo: "",
  categoria: "",
  status: "available",
  descricao: "",
});

const imageFile = ref<File | null>(null);
const previewUrl = ref<string | null>(null);
const saving = ref(false);
const errorMessage = ref("");
const nuxtApp = useNuxtApp();
const firebase = nuxtApp.$firebase;

const hasFirebase = computed(() => Boolean(firebase?.database));
const canSubmit = computed(
  () => hasFirebase.value && form.nome.trim().length > 2 && !saving.value
);

function selectImage(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files && target.files.length ? target.files[0] : null;
  imageFile.value = file;
}

watchEffect(() => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
    previewUrl.value = null;
  }
  if (imageFile.value) {
    previewUrl.value = URL.createObjectURL(imageFile.value);
  }
});

onBeforeUnmount(() => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
  }
});

async function submit() {
  errorMessage.value = "";
  if (!canSubmit.value) return;
  if (!firebase?.database) {
    errorMessage.value = "Firebase nao configurado. Verifique suas variaveis.";
    return;
  }

  saving.value = true;
  try {
    const itemsRef = dbRef(firebase.database, "items");
    const newItemRef = push(itemsRef);
    const itemId = newItemRef.key;
    if (!itemId) {
      throw new Error("Falha ao gerar identificador do item.");
    }
    let imageUrl: string | null = null;
    let imagePath: string | null = null;

    if (imageFile.value && firebase.storage) {
      const safeName = imageFile.value.name.replace(/\s+/g, "-").toLowerCase();
      imagePath = `items/${itemId}/${Date.now()}-${safeName}`;
      const fileRef = storageRef(firebase.storage, imagePath);
      await uploadBytes(fileRef, imageFile.value);
      imageUrl = await getDownloadURL(fileRef);
    }

    const nowIso = new Date().toISOString();
    await set(newItemRef, {
      id: itemId,
      name: form.nome.trim(),
      code: form.codigo.trim() || null,
      category: form.categoria.trim() || null,
      status: form.status,
      description: form.descricao.trim() || null,
      imageUrl,
      imagePath,
      createdAt: nowIso,
      updatedAt: nowIso,
    });

    navigateTo("/admin/home");
  } catch (error) {
    console.error("[items] create error:", error);
    errorMessage.value =
      "Nao foi possivel salvar o item. Tente novamente em instantes.";
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <main class="form-container">
    <section class="card">
      <header class="mb-4">
        <h1 class="h1">Novo item</h1>
        <p class="muted caption">
          Cadastre um novo equipamento com status e imagem opcional.
        </p>
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
            <label class="label">Codigo</label>
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
              placeholder="Ex.: Perfuracao"
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
            placeholder="Detalhes, potencia, voltagem, acessorios..."
          ></textarea>
        </div>

        <div class="field">
          <label class="label">Imagem do equipamento (opcional)</label>
          <input
            type="file"
            accept="image/*"
            class="input input-file"
            @change="selectImage"
          />
          <p class="hint">
            Use imagens em formato JPG ou PNG com ate 3MB. Sera exibida no
            catálogo.
          </p>
          <div v-if="previewUrl" class="preview">
            <img :src="previewUrl" alt="Pre-visualizacao do equipamento" />
          </div>
        </div>

        <p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>

        <div class="actions">
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="!canSubmit || saving"
          >
            <span v-if="!saving">Salvar</span>
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

.h1 {
  font-size: 24px;
  line-height: 1.2;
  font-weight: 700;
  letter-spacing: 0.2px;
  margin-top: 2px;
}
.muted {
  color: rgb(var(--muted));
}
.caption {
  font-size: 14px;
}
.label {
  font-size: 14px;
  color: rgb(var(--muted));
}
.hint {
  margin: 6px 0 0;
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

.input-file {
  padding: 10px 12px;
  cursor: pointer;
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

.preview {
  display: inline-flex;
  padding: 12px;
  border-radius: 16px;
  border: 1px dashed rgba(var(--muted), 0.4);
  background: rgb(var(--surface-2));
  max-width: 260px;
}
.preview img {
  display: block;
  width: 100%;
  border-radius: 10px;
  object-fit: cover;
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

.error-msg {
  color: rgb(220, 38, 38);
  font-size: 14px;
}
</style>
