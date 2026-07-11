import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Attach token automatically if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/**
 * Calls POST /api/login
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{success: boolean, token?: string, user?: object, message?: string}>}
 */
export async function login(email, password) {
  try {
    const response = await api.post('/api/login', { email, password })
    return response.data
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data
    }
    return { success: false, message: 'Network error. Please try again.' }
  }
}

export default api
