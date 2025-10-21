<template>
  <div class="landing">
    <div class="decor"></div>

    <header class="top">
      <NuxtLink to="/" class="logo" aria-label="AlugaAI">
        <span class="logo-mark">🛠️</span>
        <span class="logo-text">AlugaAI</span>
      </NuxtLink>
      <nav class="nav">
        <NuxtLink to="/login" class="nav-link">Entrar</NuxtLink>
        <NuxtLink to="/register" class="btn btn-primary">Criar conta</NuxtLink>
      </nav>
    </header>

    <main class="content">
      <section
        ref="heroSection"
        class="hero section-animate"
        :class="{ 'is-visible': heroVisible }"
      >
        <div class="hero-copy" :class="{ 'is-revealed': heroVisible }">
          <p class="tag">Plataforma de locação inteligente</p>
          <h1>
            Alugue equipamentos com praticidade, controle total e suporte em
            tempo real.
          </h1>
          <p class="subtitle">
            Organize seu catálogo, controle locações com datas definidas e
            disponibilize imagens para que seus clientes encontrem o que
            precisam em segundos.
          </p>
          <div class="cta">
            <NuxtLink to="/register" class="btn btn-primary btn-lg">
              Começar agora
            </NuxtLink>
            <NuxtLink to="/login" class="btn btn-outline btn-lg">
              Já tenho conta
            </NuxtLink>
          </div>
          <ul class="hero-points">
            <li v-for="point in heroPoints" :key="point" class="hero-point">
              <span class="check" aria-hidden="true">&check;</span>
              <span>{{ point }}</span>
            </li>
          </ul>
        </div>

        <div class="hero-illustration" :class="{ 'is-revealed': heroVisible }">
          <div class="glass" :class="{ 'animate-glass': heroVisible }">
            <div class="glass-header">
              <span class="dot"></span>
              <span class="dot"></span>
              <span class="dot"></span>
            </div>
            <div class="glass-body">
              <div class="glass-card">
                <p class="glass-title">Reservas do dia</p>
                <p class="glass-value">5 locações</p>
              </div>
              <div class="glass-card">
                <p class="glass-title">Itens disponiveis</p>
                <p class="glass-value">32 equipamentos</p>
              </div>
              <div class="glass-card highlight">
                <p class="glass-title">Renovações pendentes</p>
                <p class="glass-value">2 até hoje</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        ref="featuresSection"
        class="features section-animate"
        :class="{ 'is-visible': featuresVisible }"
      >
        <header class="section-head">
          <h2>Uma operação completa para seu negócio de locação</h2>
          <p>
            Cadastre novos itens com fotos, defina períodos de locação com
            facilidade e acompanhe a disponibilidade em tempo real.
          </p>
        </header>
        <div class="feature-grid">
          <article
            v-for="(feature, index) in features"
            :key="feature.title"
            class="feature"
            :style="{ '--delay': index }"
          >
            <div class="feature-icon">{{ feature.icon }}</div>
            <h3>{{ feature.title }}</h3>
            <p>{{ feature.description }}</p>
          </article>
        </div>
      </section>

      <section
        ref="stepsSection"
        class="steps section-animate"
        :class="{ 'is-visible': stepsVisible }"
      >
        <header class="section-head">
          <h2>Como funciona</h2>
          <p>Comece em minutos com um fluxo pensado para equipes enxutas.</p>
        </header>
        <ol class="step-list">
          <li
            v-for="(step, index) in steps"
            :key="step.number"
            class="step"
            :style="{ '--delay': index }"
          >
            <span class="step-number">{{ step.number }}</span>
            <div>
              <h3>{{ step.title }}</h3>
              <p>{{ step.description }}</p>
            </div>
          </li>
        </ol>
      </section>
    </main>

    <footer class="footer">
      <div>
        <span class="logo-foot">AlugaAI</span>
        <p>
          Operação profissional de locação de equipamentos em um único lugar.
        </p>
      </div>
      <div class="footer-actions">
        <NuxtLink to="/login" class="link">Entrar</NuxtLink>
        <NuxtLink to="/register" class="link">Criar conta</NuxtLink>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, type Ref } from "vue";

const heroPoints = [
  "Agenda com horários definidos e prazos claros",
  "Controle de disponibilidade por status",
  "Cadastro com upload de imagens",
];

const features = [
  {
    icon: "CAT",
    title: "Catálogo com fotos",
    description:
      "Registre imagens e informacoes completas de cada equipamento em segundos.",
  },
  {
    icon: "HRS",
    title: "Locações com horários",
    description:
      "Defina início e término das locações com acompanhamento automático.",
  },
  {
    icon: "KPI",
    title: "Painel em tempo real",
    description:
      "Visualize locações ativas, itens disponíveis e manutenções em andamento.",
  },
];

const steps = [
  {
    number: "1",
    title: "Crie sua conta",
    description: "Configure o básico e convide sua equipe de atendimento.",
  },
  {
    number: "2",
    title: "Cadastre seus equipamentos",
    description: "Inclua descrição, status e imagens para destacar o catálogo.",
  },
  {
    number: "3",
    title: "Controle cada locação",
    description:
      "Defina períodos, receba alertas de devolução e mantenha a disponibilidade em dia.",
  },
];

const heroSection = ref<HTMLElement | null>(null);
const featuresSection = ref<HTMLElement | null>(null);
const stepsSection = ref<HTMLElement | null>(null);

const heroVisible = ref(false);
const featuresVisible = ref(false);
const stepsVisible = ref(false);

let observer: IntersectionObserver | null = null;
const targetMap = new Map<Element, Ref<boolean>>();

const revealAll = () => {
  heroVisible.value = true;
  featuresVisible.value = true;
  stepsVisible.value = true;
};

onMounted(() => {
  if (typeof window === "undefined") {
    revealAll();
    return;
  }

  const targets: Array<{ element: HTMLElement | null; state: Ref<boolean> }> = [
    { element: heroSection.value, state: heroVisible },
    { element: featuresSection.value, state: featuresVisible },
    { element: stepsSection.value, state: stepsVisible },
  ];

  if (!("IntersectionObserver" in window)) {
    revealAll();
    return;
  }

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const state = targetMap.get(entry.target);
        if (!state) return;
        if (entry.isIntersecting) {
          state.value = true;
          observer?.unobserve(entry.target);
          targetMap.delete(entry.target);
        }
      });
    },
    {
      threshold: 0.25,
      rootMargin: "0px 0px -10% 0px",
    }
  );

  targets.forEach(({ element, state }) => {
    if (!element) {
      state.value = true;
      return;
    }
    targetMap.set(element, state);
    observer?.observe(element);
  });
});

onBeforeUnmount(() => {
  observer?.disconnect();
  targetMap.clear();
});
</script>

<style scoped>
.landing {
  position: relative;
  min-height: 100vh;
  background: radial-gradient(circle at top, #f7faff, #e7eefc 40%, #f7faff);
  color: #0f172a;
  font-family: "Roboto", ui-sans-serif, system-ui, -apple-system, Segoe UI,
    Helvetica, Arial;
  display: flex;
  flex-direction: column;
}

.decor {
  position: absolute;
  inset: 0;
  background: radial-gradient(at 20% 20%, rgba(89, 156, 255, 0.12), transparent),
    radial-gradient(at 80% 0%, rgba(59, 130, 246, 0.15), transparent 60%),
    radial-gradient(at 50% 60%, rgba(14, 165, 233, 0.1), transparent 65%);
  pointer-events: none;
  z-index: 0;
  animation: glowDrift 18s ease-in-out infinite alternate;
}

.top {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px clamp(16px, 6vw, 64px);
}

.logo {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: inherit;
  text-decoration: none;
  font-weight: 700;
}

.logo-mark {
  width: 44px;
  height: 44px;
  border-radius: 16px;
  background: linear-gradient(135deg, #3b82f6, #38bdf8);
  display: grid;
  place-items: center;
  color: #fff;
  font-weight: 800;
}

.logo-text {
  font-size: 24px;
  letter-spacing: 0.6px;
}

.nav {
  display: inline-flex;
  align-items: center;
  gap: 12px;
}

.nav-link {
  color: inherit;
  text-decoration: none;
  font-weight: 600;
}

.content {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: clamp(80px, 12vw, 140px);
  padding: clamp(32px, 8vw, 80px) clamp(16px, 7vw, 96px) 120px;
}

.section-animate {
  opacity: 0;
  transform: translateY(60px);
  transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.8s ease;
}

.section-animate.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.hero {
  display: grid;
  gap: 48px;
  align-items: center;
}

@media (min-width: 1024px) {
  .hero {
    grid-template-columns: 1fr 0.9fr;
  }
}

.hero-copy {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.8s ease, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.hero-copy.is-revealed {
  opacity: 1;
  transform: translateY(0);
}

.hero-copy h1 {
  font-size: clamp(32px, 4vw, 56px);
  line-height: 1.08;
  margin-bottom: 20px;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.12);
  color: #1d4ed8;
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 16px;
}

.subtitle {
  font-size: 18px;
  line-height: 1.5;
  color: #475569;
  max-width: 600px;
  margin-bottom: 28px;
}

.cta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 28px;
}

.hero-points {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 14px;
}

.hero-point {
  display: inline-flex;
  gap: 10px;
  align-items: center;
  font-weight: 600;
  color: #0f172a;
  opacity: 0;
  transform: translateY(10px);
  transition: transform 0.4s ease, opacity 0.4s ease;
}

.hero-copy.is-revealed .hero-point {
  opacity: 1;
  transform: translateY(0);
}

.hero-copy.is-revealed .hero-point:nth-child(1) {
  transition-delay: 0.1s;
}

.hero-copy.is-revealed .hero-point:nth-child(2) {
  transition-delay: 0.2s;
}

.hero-copy.is-revealed .hero-point:nth-child(3) {
  transition-delay: 0.3s;
}

.check {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: rgba(37, 99, 235, 0.12);
  color: #1d4ed8;
  font-weight: 700;
}

.hero-illustration {
  display: grid;
  place-items: center;
  opacity: 0;
  transform: translateY(30px) scale(0.96);
  transition: transform 0.9s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.9s ease;
}

.hero-illustration.is-revealed {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.glass {
  position: relative;
  width: min(360px, 95%);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.65);
  box-shadow: 0 30px 80px rgba(15, 23, 42, 0.15);
  backdrop-filter: blur(16px);
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.35);
}

.glass.animate-glass {
  animation: floatCard 12s ease-in-out infinite;
}

.glass-header {
  display: flex;
  gap: 8px;
  padding: 16px 20px;
  background: rgba(15, 23, 42, 0.05);
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(15, 23, 42, 0.25);
}

.glass-body {
  padding: 32px 28px;
  display: grid;
  gap: 20px;
}

.glass-card {
  padding: 20px 24px;
  border-radius: 18px;
  background: rgba(241, 245, 249, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.25);
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.08);
  transform: translateY(12px);
  opacity: 0;
  transition: transform 0.6s ease, opacity 0.6s ease;
}

.hero-illustration.is-revealed .glass-card {
  transform: translateY(0);
  opacity: 1;
}

.hero-illustration.is-revealed .glass-card:nth-child(1) {
  transition-delay: 0.1s;
}

.hero-illustration.is-revealed .glass-card:nth-child(2) {
  transition-delay: 0.2s;
}

.hero-illustration.is-revealed .glass-card:nth-child(3) {
  transition-delay: 0.3s;
}

.glass-card.highlight {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.22), #ffffff);
  border-color: rgba(37, 99, 235, 0.3);
}

.glass-title {
  font-size: 14px;
  color: #334155;
  margin-bottom: 8px;
}

.glass-value {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
}

.features {
  display: grid;
  gap: 36px;
}

.section-head {
  text-align: center;
  max-width: 720px;
  margin: 0 auto;
  display: grid;
  gap: 12px;
}

.section-head h2 {
  font-size: clamp(28px, 3vw, 40px);
}

.section-head p {
  color: #475569;
  font-size: 18px;
}

.feature-grid {
  display: grid;
  gap: 24px;
}

@media (min-width: 900px) {
  .feature-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.feature {
  background: rgba(255, 255, 255, 0.85);
  border-radius: 22px;
  padding: 28px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.08);
  display: grid;
  gap: 16px;
  transform: translateY(32px);
  opacity: 0;
  transition: transform 0.6s ease, opacity 0.6s ease;
  transition-delay: calc(var(--delay, 0) * 0.15s + 0.1s);
}

.section-animate.is-visible .feature {
  transform: translateY(0);
  opacity: 1;
}

.feature-icon {
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 2px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: rgba(37, 99, 235, 0.14);
  color: #1d4ed8;
}

.feature h3 {
  font-size: 20px;
  font-weight: 700;
}

.feature p {
  color: #475569;
}

.steps {
  display: grid;
  gap: 32px;
}

.step-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 24px;
}

@media (min-width: 900px) {
  .step-list {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 20px;
  }
}

.step {
  background: rgba(15, 23, 42, 0.92);
  color: #f8fafc;
  border-radius: 24px;
  padding: 32px 28px;
  display: grid;
  gap: 12px;
  position: relative;
  overflow: hidden;
  transform: translateY(24px);
  opacity: 0;
  transition: transform 0.6s ease, opacity 0.6s ease;
  transition-delay: calc(var(--delay, 0) * 0.15s + 0.1s);
}

.section-animate.is-visible .step {
  transform: translateY(0);
  opacity: 1;
}

.step::after {
  content: "";
  position: absolute;
  inset: auto -10px -40px;
  height: 120px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.4), transparent);
}

.step-number {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: rgba(59, 130, 246, 0.25);
  display: grid;
  place-items: center;
  font-size: 18px;
  font-weight: 700;
}

.footer {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 32px clamp(16px, 6vw, 64px);
  border-top: 1px solid rgba(148, 163, 184, 0.35);
  background: rgba(255, 255, 255, 0.75);
}

@media (min-width: 640px) {
  .footer {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.logo-foot {
  font-weight: 800;
  font-size: 20px;
  letter-spacing: 0.4px;
  display: inline-block;
  margin-bottom: 6px;
}

.footer-actions {
  display: inline-flex;
  gap: 16px;
  align-items: center;
}

.link {
  color: #2563eb;
  font-weight: 600;
  text-decoration: none;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  padding: 12px 20px;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid transparent;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease,
    opacity 0.15s ease;
}

.btn:hover {
  transform: translateY(-1px);
}

.btn-primary {
  background: linear-gradient(135deg, #2563eb, #38bdf8);
  color: #fff;
  box-shadow: 0 16px 32px rgba(37, 99, 235, 0.25);
}

.btn-outline {
  border-color: rgba(37, 99, 235, 0.35);
  color: #1d4ed8;
  background: rgba(255, 255, 255, 0.9);
}

.btn-lg {
  padding: 14px 24px;
  border-radius: 16px;
}

@keyframes glowDrift {
  0% {
    transform: translate3d(0, 0, 0);
    opacity: 0.8;
  }
  50% {
    transform: translate3d(0, 12px, 0) scale(1.02);
    opacity: 1;
  }
  100% {
    transform: translate3d(0, -8px, 0);
    opacity: 0.85;
  }
}

@keyframes floatCard {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}
</style>
