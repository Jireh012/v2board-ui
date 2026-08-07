import { computed, ref } from 'vue'

const authData = ref<string | null>(localStorage.getItem('auth_data'))
const userEmail = ref<string | null>(
  localStorage.getItem('user_email') || localStorage.getItem('admin_email')
)
const isAdmin = ref(localStorage.getItem('is_admin') === '1')

export const isLoggedIn = computed(() => !!authData.value)
export const currentUserEmail = computed(() => userEmail.value || '账户')
export const isAdminUser = computed(() => isAdmin.value)

export function setSession(payload: {
  auth_data: string
  token: string
  is_admin: boolean
  email?: string
}) {
  localStorage.setItem('auth_data', payload.auth_data)
  localStorage.setItem('token', payload.token)
  localStorage.setItem('is_admin', payload.is_admin ? '1' : '0')
  authData.value = payload.auth_data
  isAdmin.value = payload.is_admin
  if (payload.email) {
    localStorage.setItem('user_email', payload.email)
    userEmail.value = payload.email
  }
}

export function setUserEmail(email: string) {
  localStorage.setItem('user_email', email)
  userEmail.value = email
}

export function clearSession() {
  localStorage.removeItem('auth_data')
  localStorage.removeItem('token')
  localStorage.removeItem('is_admin')
  localStorage.removeItem('user_email')
  localStorage.removeItem('admin_email')
  authData.value = null
  userEmail.value = null
  isAdmin.value = false
}
