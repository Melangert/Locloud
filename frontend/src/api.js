const BASE = '/api'

function getToken() {
  return localStorage.getItem('token')
}

function authHeaders() {
  return {
    'Authorization': `Bearer ${getToken()}`,
    'Content-Type': 'application/json'
  }
}

export async function login(username, password) {
  const form = new FormData()
  form.append('username', username)
  form.append('password', password)
  const res = await fetch(`${BASE}/auth/login`, { method: 'POST', body: form })
  if (!res.ok) throw new Error('Invalid credentials')
  return res.json()
}

export async function getFiles(folderId = null) {
  const url = folderId ? `${BASE}/files/?folder_id=${folderId}` : `${BASE}/files/`
  const res = await fetch(url, { headers: authHeaders() })
  return res.json()
}

export async function uploadFile(file, folderId = null) {
  const form = new FormData()
  form.append('file', file)
  const url = folderId ? `${BASE}/files/upload?folder_id=${folderId}` : `${BASE}/files/upload`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${getToken()}` },
    body: form
  })
  return res.json()
}

export async function downloadFile(fileId, fileName) {
  const res = await fetch(`${BASE}/files/download/${fileId}`, { headers: authHeaders() })
  const blob = await res.blob()
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = fileName
  a.click()
}

export async function deleteFile(fileId) {
  await fetch(`${BASE}/files/${fileId}`, { method: 'DELETE', headers: authHeaders() })
}

export async function renameFile(fileId, name) {
  const res = await fetch(`${BASE}/files/${fileId}/rename`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ name })
  })
  return res.json()
}

export async function getFolders(parentId = null) {
  const url = parentId ? `${BASE}/folders/?parent_id=${parentId}` : `${BASE}/folders/`
  const res = await fetch(url, { headers: authHeaders() })
  return res.json()
}

export async function createFolder(name, parentId = null) {
  const res = await fetch(`${BASE}/folders/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ name, parent_id: parentId })
  })
  return res.json()
}

export async function deleteFolder(folderId) {
  await fetch(`${BASE}/folders/${folderId}`, { method: 'DELETE', headers: authHeaders() })
}

export async function getStorageUsage() {
  const res = await fetch(`${BASE}/storage/usage`, { headers: authHeaders() })
  return res.json()
}
