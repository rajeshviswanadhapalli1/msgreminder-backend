process.env.NODE_ENV = 'test';
require('dotenv').config();

const request = require('supertest');
const { app } = require('../src/server');
const { sequelize, User, Reminder } = require('../src/models');

let authToken;
let userId;
let reminderId;

const testUser = {
  fullName: 'Test User',
  email: `test${Date.now()}@example.com`,
  country: 'India',
  countryCode: '+91',
  mobile: `${Date.now()}`.slice(-10),
  password: 'TestPass123',
  timezone: 'Asia/Kolkata',
};

beforeAll(async () => {
  await sequelize.authenticate();
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Auth', () => {
  test('registers a new user', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());

    authToken = res.body.data.token;
    userId = res.body.data.user.id;
  });

  test('rejects duplicate email', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(testUser);
    expect(res.status).toBe(409);
  });

  test('logs in with valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
    authToken = res.body.data.token;
  });

  test('rejects invalid login', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testUser.email, password: 'wrongpassword' });

    expect(res.status).toBe(401);
  });

  test('forgot password returns generic message', async () => {
    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: testUser.email });

    expect(res.status).toBe(200);
    expect(res.body.data.message).toContain('If an account exists');
  });
});

describe('Users', () => {
  test('gets current profile', async () => {
    const res = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(userId);
  });

  test('updates profile', async () => {
    const res = await request(app)
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ fullName: 'Updated Name' });

    expect(res.status).toBe(200);
    expect(res.body.data.fullName).toBe('Updated Name');
  });

  test('rejects unauthenticated request', async () => {
    const res = await request(app).get('/api/v1/users/me');
    expect(res.status).toBe(401);
  });
});

describe('Reminders', () => {
  const scheduledAt = new Date(Date.now() + 86400000).toISOString();

  test('creates a reminder', async () => {
    const res = await request(app)
      .post('/api/v1/reminders')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Test Reminder',
        message: 'Remember to test the API',
        scheduledAt,
        timezone: 'Asia/Kolkata',
        repeat: 'none',
        priority: 'medium',
        category: 'general',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.message).toBe('Remember to test the API');
    reminderId = res.body.data.id;
  });

  test('rejects message over 500 chars', async () => {
    const res = await request(app)
      .post('/api/v1/reminders')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        message: 'x'.repeat(501),
        scheduledAt,
      });

    expect(res.status).toBe(400);
  });

  test('lists upcoming reminders', async () => {
    const res = await request(app)
      .get('/api/v1/reminders?view=upcoming')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.meta.total).toBeGreaterThan(0);
  });

  test('gets reminder by id', async () => {
    const res = await request(app)
      .get(`/api/v1/reminders/${reminderId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(reminderId);
  });

  test('updates reminder', async () => {
    const res = await request(app)
      .patch(`/api/v1/reminders/${reminderId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ priority: 'high' });

    expect(res.status).toBe(200);
    expect(res.body.data.priority).toBe('high');
  });

  test('completes non-repeating reminder', async () => {
    const res = await request(app)
      .post(`/api/v1/reminders/${reminderId}/complete`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.completed.status).toBe('completed');
    expect(res.body.data.next).toBeNull();
  });

  test('lists completed reminders', async () => {
    const res = await request(app)
      .get('/api/v1/reminders?view=completed')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.some((r) => r.id === reminderId)).toBe(true);
  });

  test('creates and completes repeating reminder', async () => {
    const createRes = await request(app)
      .post('/api/v1/reminders')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        message: 'Daily reminder',
        scheduledAt,
        repeat: 'daily',
      });

    const id = createRes.body.data.id;

    const completeRes = await request(app)
      .post(`/api/v1/reminders/${id}/complete`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(completeRes.status).toBe(200);
    expect(completeRes.body.data.completed.status).toBe('completed');
    expect(completeRes.body.data.next.status).toBe('pending');
    expect(completeRes.body.data.next.repeat).toBe('daily');
  });

  test('returns 404 for another users reminder', async () => {
    const other = await User.create({
      fullName: 'Other',
      email: `other${Date.now()}@example.com`,
      country: 'India',
      countryCode: '+91',
      mobile: `${Date.now() + 1}`.slice(-10),
      passwordHash: await User.hashPassword('OtherPass123'),
    });

    const otherReminder = await Reminder.create({
      userId: other.id,
      message: 'Private',
      scheduledAt: new Date(),
    });

    const res = await request(app)
      .get(`/api/v1/reminders/${otherReminder.id}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(404);
  });

  test('deletes reminder', async () => {
    const createRes = await request(app)
      .post('/api/v1/reminders')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ message: 'To delete', scheduledAt });

    const id = createRes.body.data.id;

    const res = await request(app)
      .delete(`/api/v1/reminders/${id}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
  });
});

describe('Health', () => {
  test('health check returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
