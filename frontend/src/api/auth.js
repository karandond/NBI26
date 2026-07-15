import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

function handleError(error) {
  if (error.response?.data) return error.response.data
  return { success: false, message: 'Network error. Please try again.' }
}

export async function login(email, password) {
  try {
    const response = await api.post('/api/login', { email, password })
    return response.data
  } catch (error) {
    return handleError(error)
  }
}

export async function signup(email, password) {
  try {
    const response = await api.post('/api/signup', { email, password })
    return response.data
  } catch (error) {
    return handleError(error)
  }
}

export async function getUsers() {
  try {
    const response = await api.get('/api/admin/users')
    return response.data
  } catch (error) {
    return handleError(error)
  }
}

export async function updateUserStatus(id, status) {
  try {
    const response = await api.patch(`/api/admin/users/${id}/status`, { status })
    return response.data
  } catch (error) {
    return handleError(error)
  }
}

export default api
