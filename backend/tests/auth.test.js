import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { connectMongoDB, closeMongoDB } from '../src/config/mongodb.js';
import { User } from '../src/models/User.js';

describe('Authentication & User Management Endpoints', () => {
  const testUser = {
    name: 'Test Cinematic User',
    email: `cinetester_${Date.now()}@example.com`,
    password: 'password123'
  };

  let authToken = null;

  before(async () => {
    await connectMongoDB();
  });

  after(async () => {
    // Cleanup test user
    if (testUser.email) {
      await User.deleteOne({ email: testUser.email });
    }
    await closeMongoDB();
  });

  test('POST /api/auth/register creates a new user and returns JWT token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.token, 'Should return JWT token');
    assert.equal(res.body.user.email, testUser.email);
    assert.equal(res.body.user.name, testUser.name);
    authToken = res.body.token;
  });

  test('POST /api/auth/register rejects duplicate email with 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /already exists/i);
  });

  test('POST /api/auth/login validates credentials and issues token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.token);
  });

  test('POST /api/auth/login rejects incorrect password with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'wrong_password'
      });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  test('GET /api/auth/me returns authenticated user profile', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.user.email, testUser.email);
  });

  test('GET /api/auth/me without token returns 401 Unauthorized', async () => {
    const res = await request(app).get('/api/auth/me');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });
});
