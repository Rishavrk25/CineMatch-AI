import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';

describe('System Health & Foundation Tests', () => {
  test('GET / returns API welcome and version info', async () => {
    const res = await request(app).get('/');
    assert.equal(res.status, 200);
    assert.equal(res.body.message, 'Welcome to CineMatch AI API');
    assert.equal(res.body.version, '1.0.0');
  });

  test('GET /api/health returns 200 with service health breakdown', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.service, 'CineMatch AI Backend API');
    assert.ok(res.body.integrations, 'Integrations object must be present');
    assert.ok(res.body.integrations.mongodb, 'MongoDB integration status must be present');
    assert.ok(res.body.integrations.neo4j, 'Neo4j integration status must be present');
    assert.ok(res.body.integrations.pinecone, 'Pinecone integration status must be present');
    assert.ok(res.body.integrations.gemini, 'Gemini integration status must be present');
  });

  test('GET /api/nonexistent returns 404 with structured error', async () => {
    const res = await request(app).get('/api/nonexistent');
    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /not found/i);
  });
});
