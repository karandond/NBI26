import api from './auth.js'

const API_URL = import.meta.env.VITE_API_URL

function handleError(error) {
  if (error.response?.data) return error.response.data
  return { success: false, message: 'Network error. Please try again.' }
}

export async function listFiles(projectId) {
  try {
    const res = await api.get(`/api/projects/${projectId}/files`)
    return res.data
  } catch (error) {
    return handleError(error)
  }
}

export async function uploadFiles(projectId, fileList, onProgress) {
  try {
    const formData = new FormData()
    for (const file of fileList) formData.append('files', file)

    const res = await api.post(`/api/projects/${projectId}/files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total))
      },
    })
    return res.data
  } catch (error) {
    return handleError(error)
  }
}

export async function deleteFile(projectId, fileId) {
  try {
    const res = await api.delete(`/api/projects/${projectId}/files/${fileId}`)
    return res.data
  } catch (error) {
    return handleError(error)
  }
}

export function downloadFile(projectId, fileId, fileName) {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token')
  return fetch(`${API_URL}/api/projects/${projectId}/files/${fileId}/download`, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => {
      if (!res.ok) throw new Error('Download failed')
      return res.blob()
    })
    .then((blob) => {
      const url = URL.createObjectURL(blob)
      const a   = document.createElement('a')
      a.href     = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    })
}
