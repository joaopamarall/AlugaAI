// app/middleware/auth.global.ts
export default defineNuxtRouteMiddleware((to) => {
  // só no client (localStorage)
  if (process.server) return

  // rotas protegidas (prefix match)
  const PROTECTED = ['/home'] // adicione mais: '/dashboard', '/locacoes', etc.
  const needsAuth = PROTECTED.some(p => to.path.startsWith(p))
  if (!needsAuth) return

  const raw = localStorage.getItem('alugaai:user')
  if (!raw) {
    return navigateTo('/') // volta pro login
  }
})
