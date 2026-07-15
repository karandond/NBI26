import api from './auth.js'
import { cached, invalidate } from './cache.js'

function handleError(error) {
  if (error.response?.data) return error.response.data
  return { success: false, message: 'Network error. Please try again.' }
}

const CUSTOMERS_TTL  = 60_000  // 60 s
const MY_PROJ_TTL    = 60_000

export async function getCustomers() {
  return cached('customers', CUSTOMERS_TTL, async () => {
    try {
      const res = await api.get('/api/admin/customers')
      return res.data
    } catch (error) {
      return handleError(error)
    }
  })
}

export async function createCustomer(name) {
  try {
    const res = await api.post('/api/admin/customers', { name })
    invalidate('customers')
    return res.data
  } catch (error) {
    return handleError(error)
  }
}

export async function deleteCustomer(id) {
  try {
    const res = await api.delete(`/api/admin/customers/${id}`)
    invalidate('customers')
    return res.data
  } catch (error) {
    return handleError(error)
  }
}

export async function addProject(customerId, name) {
  try {
    const res = await api.post(`/api/admin/customers/${customerId}/projects`, { name })
    invalidate('customers')
    return res.data
  } catch (error) {
    return handleError(error)
  }
}

export async function removeProject(customerId, projectId) {
  try {
    const res = await api.delete(`/api/admin/customers/${customerId}/projects/${projectId}`)
    invalidate('customers')
    return res.data
  } catch (error) {
    return handleError(error)
  }
}

export async function assignCustomer(userId, customerId) {
  try {
    const res = await api.patch(`/api/admin/users/${userId}/customer`, { customerId })
    invalidate('myProjects')
    return res.data
  } catch (error) {
    return handleError(error)
  }
}

export async function getMyProjects() {
  return cached('myProjects', MY_PROJ_TTL, async () => {
    try {
      const res = await api.get('/api/me/projects')
      return res.data
    } catch (error) {
      return handleError(error)
    }
  })
}
