const BASE = '/api'

function getToken() {
  return localStorage.getItem('token')
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {})
  if (!headers.has('Authorization') && getToken()) {
    headers.set('Authorization', `Bearer ${getToken()}`)
  }
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${BASE}${path}`, { ...options, headers })
  if (response.status === 401) {
    localStorage.removeItem('token')
    window.dispatchEvent(new Event('locloud:unauthorized'))
  }
  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try {
      const body = await response.json()
      message = body.detail || message
    } catch {
      // Keep the HTTP status when the server does not return JSON.
    }
    throw new Error(message)
  }
  if (response.status === 204) return null
  return response.json()
}

export function getErrorMessage(error) {
  return error instanceof Error ? error.message : 'Something went wrong'
}

export async function login(username, password) {
  const form = new FormData()
  form.append('username', username)
  form.append('password', password)
  return request('/auth/login', { method: 'POST', body: form })
}

export function getFiles(folderId = null) {
  return request(`/files/${folderId ? `?folder_id=${encodeURIComponent(folderId)}` : ''}`)
}

export async function uploadFile(file, folderId = null, onProgress = () => {}) {
  const { id: fileId } = await request(`/files/upload/start?filename=${encodeURIComponent(file.name)}${folderId ? `&folder_id=${encodeURIComponent(folderId)}` : ''}`, { method: 'POST' })
  const chunkSize = 10 * 1024 * 1024
  const totalChunks = Math.max(1, Math.ceil(file.size / chunkSize))

  for (let index = 0; index < totalChunks; index += 1) {
    const form = new FormData()
    form.append('file', file.slice(index * chunkSize, (index + 1) * chunkSize), file.name)
    await request(`/files/upload/chunk?file_id=${encodeURIComponent(fileId)}&chunk_index=${index}`, {
      method: 'POST',
      body: form,
    })
    onProgress(Math.round(((index + 1) / totalChunks) * 95))
  }

  const result = await request(`/files/upload/finish?file_id=${encodeURIComponent(fileId)}&total_chunks=${totalChunks}`, { method: 'POST' })
  onProgress(100)
  return result
}

export async function downloadFile(fileId, fileName) {
  const response = await fetch(`${BASE}/files/download/${encodeURIComponent(fileId)}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  })
  if (!response.ok) throw new Error('Unable to download file')
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(url)
}

export function deleteFile(fileId) {
  return request(`/files/${encodeURIComponent(fileId)}`, { method: 'DELETE' })
}

export function renameFile(fileId, name) {
  return request(`/files/${encodeURIComponent(fileId)}/rename`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  })
}

export function moveFile(fileId, folderId = null) {
  return request(`/files/${encodeURIComponent(fileId)}/move`, {
    method: 'PATCH',
    body: JSON.stringify({ folder_id: folderId }),
  })
}

export function getFolders(parentId = null) {
  return request(`/folders/${parentId ? `?parent_id=${encodeURIComponent(parentId)}` : ''}`)
}

export function createFolder(name, parentId = null) {
  return request('/folders/', {
    method: 'POST',
    body: JSON.stringify({ name, parent_id: parentId }),
  })
}

export function renameFolder(folderId, name) {
  return request(`/folders/${encodeURIComponent(folderId)}/rename`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  })
}

export function deleteFolder(folderId) {
  return request(`/folders/${encodeURIComponent(folderId)}`, { method: 'DELETE' })
}

export function getStorageUsage() {
  return request('/storage/usage')
}
