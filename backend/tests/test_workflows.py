"""Integration tests using an isolated database and uploads, with no listening socket.
Run: cd backend && venv/bin/python -m unittest discover -s tests -v
Requires httpx (or the installed httpx2 compatibility package).
"""
import os
import tempfile
import unittest
import asyncio
from pathlib import Path

_sandbox = tempfile.TemporaryDirectory(prefix='locloud-tests-')
os.environ['DATABASE_URL'] = 'sqlite:///' + str(Path(_sandbox.name) / 'test.db')
os.environ['UPLOAD_DIR'] = str(Path(_sandbox.name) / 'uploads')
os.environ['JWT_SECRET'] = 'isolated-test-secret-never-used-in-production'
from passlib.context import CryptContext
os.environ['PASSWORD_HASH'] = CryptContext(schemes=['bcrypt']).hash('admin')
try:
    import httpx
except ImportError:
    import httpx2 as httpx
from main import app
from db.database import init_db, engine, SessionLocal
from db.models import Base, File, Credential
from config import settings
from sqlalchemy import text, inspect

class Workflows(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        # Restricted runners can block asyncio's socket-based thread wakeup.
        # A timer keeps the real ASGI app/worker threads progressing there.
        self.poll_timer = None
        if os.environ.get('LOCLOUD_TEST_POLL_LOOP') == '1':
            def poll():
                self.poll_timer = asyncio.get_running_loop().call_later(0.01, poll)
            poll()
        Base.metadata.drop_all(engine)
        init_db()
        self.client = httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url='http://test')
        login = await self.client.post('/api/auth/login', data={'username': 'admin', 'password': 'admin'})
        self.assertEqual(login.status_code, 200, login.text)
        self.token = login.json()['access_token']
        self.client.headers['Authorization'] = 'Bearer ' + self.token

    async def asyncTearDown(self):
        await self.client.aclose()
        # Keep the timer alive through executor shutdown; closing the loop clears it.

    async def folder(self, name='Folder', parent=None):
        result = await self.client.post('/api/folders/', json={'name': name, 'parent_id': parent})
        self.assertEqual(result.status_code, 200, result.text)
        return result.json()['id']

    async def start(self, name='hello.txt', folder=None):
        params = {'filename': name}
        if folder: params['folder_id'] = folder
        result = await self.client.post('/api/files/upload/start', params=params)
        self.assertEqual(result.status_code, 200, result.text)
        return result.json()['id']

    async def chunk(self, file_id, data=b'hello world', index=0):
        return await self.client.post('/api/files/upload/chunk', params={'file_id': file_id, 'chunk_index': index}, files={'file': ('chunk', data)})

    async def finish(self, file_id, count=1):
        return await self.client.post('/api/files/upload/finish', params={'file_id': file_id, 'total_chunks': count})

    async def test_file_lifecycle_and_folder_navigation(self):
        parent = await self.folder('Parent')
        nested = await self.folder('Nested', parent)
        tree = (await self.client.get('/api/folders/all')).json()
        self.assertEqual(len(tree), 2)
        file_id = await self.start(folder=nested)
        self.assertEqual((await self.client.get('/api/files/', params={'folder_id': nested})).json(), [])
        self.assertEqual((await self.chunk(file_id, b'hello ', 0)).status_code, 200)
        self.assertEqual((await self.chunk(file_id, b'world', 1)).status_code, 200)
        self.assertEqual((await self.finish(file_id, 2)).status_code, 200)
        downloaded = await self.client.get('/api/files/download/' + file_id)
        self.assertEqual(downloaded.content, b'hello world')
        renamed = await self.client.patch(f'/api/files/{file_id}/rename', json={'name': 'renamed.txt'})
        self.assertEqual(renamed.json()['name'], 'renamed.txt')
        self.assertEqual((await self.client.patch(f'/api/files/{file_id}/move', json={'folder_id': None})).status_code, 200)
        self.assertEqual(len((await self.client.get('/api/files/')).json()), 1)
        self.assertEqual((await self.client.patch(f'/api/folders/{parent}/rename', json={'name': 'Changed'})).status_code, 200)
        self.assertEqual((await self.client.delete(f'/api/files/{file_id}')).status_code, 200)
        self.assertEqual((await self.client.get('/api/files/download/' + file_id)).status_code, 404)
        await self.client.delete(f'/api/folders/{parent}')
        self.assertEqual((await self.client.get('/api/folders/all')).json(), [])

    async def test_cancel_and_recursive_delete_clean_chunks(self):
        folder = await self.folder()
        file_id = await self.start(folder=folder)
        await self.chunk(file_id)
        chunks = Path(settings.UPLOAD_DIR) / '_chunks' / file_id
        self.assertTrue(chunks.exists())
        self.assertEqual((await self.client.delete('/api/files/' + file_id)).status_code, 200)
        self.assertFalse(chunks.exists())
        self.assertEqual((await self.finish(file_id)).status_code, 404)
        child = await self.folder('Child', folder)
        other = await self.start(folder=child)
        await self.chunk(other)
        await self.client.delete('/api/folders/' + folder)
        self.assertFalse((Path(settings.UPLOAD_DIR) / '_chunks' / other).exists())
        with SessionLocal() as db:
            self.assertEqual(db.query(File).count(), 0)

    async def test_empty_files_missing_chunks_and_completed_upload_protection(self):
        file_id = await self.start('empty.txt')
        self.assertEqual((await self.finish(file_id)).status_code, 400)
        self.assertEqual((await self.chunk(file_id, b'', -1)).status_code, 400)
        await self.chunk(file_id, b'')
        self.assertEqual((await self.finish(file_id)).json()['size'], 0)
        self.assertEqual((await self.client.get('/api/files/download/' + file_id)).content, b'')
        self.assertEqual((await self.chunk(file_id, b'overwrite')).status_code, 404)
        self.assertEqual((await self.finish(file_id)).status_code, 404)

    async def test_oversized_chunk_is_not_accepted_as_complete(self):
        file_id = await self.start()
        response = await self.chunk(file_id, b'x' * (10 * 1024 * 1024 + 1))
        self.assertEqual(response.status_code, 413)
        self.assertEqual((await self.finish(file_id)).status_code, 400)
        self.assertFalse((Path(settings.UPLOAD_DIR) / '_chunks' / file_id / '0.partial').exists())
        await self.chunk(file_id, b'retry')
        self.assertEqual((await self.finish(file_id)).status_code, 200)
        self.assertEqual((await self.client.get('/api/files/download/' + file_id)).content, b'retry')

    async def test_authentication_and_validation(self):
        self.assertEqual((await self.client.get('/api/files/', headers={'Authorization': 'Bearer invalid'})).status_code, 401)
        self.assertEqual((await self.client.post('/api/auth/login', data={'username': 'admin', 'password': 'wrong'})).status_code, 401)
        self.assertEqual((await self.client.post('/api/folders/', json={'name': ' '})).status_code, 400)
        self.assertEqual((await self.client.post('/api/files/upload/start', params={'filename': '..'})).status_code, 400)
        file_id = await self.start()
        self.assertEqual((await self.client.patch(f'/api/files/{file_id}/move', json={'folder_id': 'missing'})).status_code, 400)

    async def test_ownership(self):
        from db.models import Folder
        with SessionLocal() as db:
            db.add(Folder(id='private-folder', name='Private', owner='someone-else'))
            db.add(File(id='private-file', name='Private', owner='someone-else', path='other', size=1, status='uploading'))
            db.commit()
        self.assertEqual((await self.client.get('/api/folders/all')).json(), [])
        self.assertEqual((await self.client.delete('/api/files/private-file')).status_code, 404)
        self.assertEqual((await self.chunk('private-file')).status_code, 404)
        self.assertEqual((await self.client.delete('/api/folders/private-folder')).status_code, 404)

    async def test_password_persistence_and_session_revocation(self):
        self.assertEqual((await self.client.post('/api/auth/password', json={'current_password': 'wrong', 'new_password': 'a-new-long-password'})).status_code, 400)
        changed = await self.client.post('/api/auth/password', json={'current_password': 'admin', 'new_password': 'a-new-long-password'})
        self.assertEqual(changed.status_code, 200, changed.text)
        self.assertEqual((await self.client.get('/api/auth/me')).status_code, 401)
        self.client.headers['Authorization'] = 'Bearer ' + changed.json()['access_token']
        self.assertEqual((await self.client.get('/api/auth/me')).status_code, 200)
        self.assertEqual((await self.client.post('/api/auth/login', data={'username': 'admin', 'password': 'admin'})).status_code, 401)
        self.assertEqual((await self.client.post('/api/auth/login', data={'username': 'admin', 'password': 'a-new-long-password'})).status_code, 200)
        with SessionLocal() as db:
            self.assertNotEqual(db.get(Credential, 'admin').password_hash, 'a-new-long-password')

    async def test_storage_and_served_frontend(self):
        usage = (await self.client.get('/api/storage/usage')).json()
        self.assertGreater(usage['disk_total'], 0)
        self.assertGreater(usage['disk_free'], 0)
        self.assertEqual(usage['used'], 0)
        file_id = await self.start()
        await self.chunk(file_id)
        await self.finish(file_id)
        usage = (await self.client.get('/api/storage/usage')).json()
        self.assertEqual(usage['used'], 11)
        self.assertEqual(usage['file_count'], 1)
        for path in ['/', '/drive', '/login']:
            response = await self.client.get(path)
            self.assertEqual(response.status_code, 200)
            self.assertIn('<div id="root">', response.text)
        self.assertEqual((await self.client.get('/api/not-found')).status_code, 404)
        self.assertEqual((await self.client.get('/api/health')).json()['app'], 'Locloud')

    async def test_existing_database_migration(self):
        with engine.begin() as connection:
            connection.execute(text('DROP TABLE files'))
            connection.execute(text('CREATE TABLE files (id VARCHAR PRIMARY KEY, name VARCHAR, path VARCHAR, size BIGINT, folder_id VARCHAR, owner VARCHAR, created_at DATETIME)'))
            connection.execute(text("INSERT INTO files (id, name, path, size, owner) VALUES ('existing', 'keep.txt', 'keep.txt', 123, 'admin')"))
        init_db()
        init_db()
        self.assertIn('status', {column['name'] for column in inspect(engine).get_columns('files')})
        with SessionLocal() as db:
            record = db.get(File, 'existing')
            self.assertEqual((record.name, record.size, record.status), ('keep.txt', 123, 'ready'))

if __name__ == '__main__':
    unittest.main()
