import axios from 'axios'
import { auth } from '@/firebase'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
})

// Attach Firebase token to every request
http.interceptors.request.use(async (config) => {
  const user = auth.currentUser
  if (user) {
    const token = await user.getIdToken()
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export function useHttp() {
  return { http }
}
