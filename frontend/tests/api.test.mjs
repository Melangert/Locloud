import { test, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { uploadFile } from '../src/api.js'

const originalFetch = globalThis.fetch
const originalStorage = globalThis.localStorage
const originalWindow = globalThis.window
afterEach(() => {
  globalThis.fetch = originalFetch
  globalThis.localStorage = originalStorage
  globalThis.window = originalWindow
})
function mock(handler) {
  globalThis.localStorage = { getItem: () => 'token', removeItem: () => {} }
  globalThis.window = { dispatchEvent: () => {} }
  const calls = []
  globalThis.fetch = async (url, options) => {
    calls.push([url, options])
    const result = await handler(url, options)
    return Response.json(result || {})
  }
  return calls
}
test('cancellation after upload start cleans its record without sending chunks', async () => {
  const controller = new AbortController()
  const calls = mock(url => {
    if (url.includes('/start')) { controller.abort(); return { id: 'upload-1' } }
  })
  await assert.rejects(uploadFile(new File(['hello'], 'hello.txt'), null, () => {}, controller.signal), { name: 'AbortError' })
  assert.equal(calls.length, 2)
  assert.equal(calls[1][0], '/api/files/upload-1')
  assert.equal(calls[1][1].method, 'DELETE')
  assert.equal(calls[1][1].signal, undefined)
})
test('failed chunk transfer cleans its incomplete upload', async () => {
  const calls = mock(url => {
    if (url.includes('/start')) return { id: 'upload-2' }
    if (url.includes('/chunk')) throw new Error('Connection interrupted')
  })
  await assert.rejects(uploadFile(new File(['hello'], 'hello.txt')), /Connection interrupted/)
  assert.equal(calls.at(-1)[1].method, 'DELETE')
  assert.ok(!calls.some(([url]) => url.includes('/finish')))
})
test('empty file sends one empty chunk and completes with full progress', async () => {
  const progress = []
  const calls = mock(url => url.includes('/start') ? { id: 'empty-1' } : { size: 0 })
  await uploadFile(new File([], 'empty.txt'), 'a folder', value => progress.push(value))
  assert.ok(calls[0][0].includes('folder_id=a%20folder'))
  assert.equal(calls[1][1].body.get('file').size, 0)
  assert.ok(calls[2][0].endsWith('total_chunks=1'))
  assert.deepEqual(progress, [95, 100])
})
