const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../../server');
const Client = require('../../models/Client');
const User = require('../../models/User');

describe('Clients Routes', () => {
  let user, token;

  describe('GET /api/clients (public)', () => {
    beforeEach(async () => {
      await Client.insertMany([
        {
          lastName: 'Иванов',
          firstName: 'Иван',
          address: 'ул. Ленина, 1',
          phone: '111 111-11-11',
          email: 'ivanov@mail.com',
        },
        {
          lastName: 'Петров',
          firstName: 'Петр',
          address: 'ул. Пушкина, 2',
          phone: '222 222-22-22',
          email: 'petrov@mail.com',
        },
        {
          lastName: 'Сидоров',
          firstName: 'Сидор',
          address: 'ул. Невского, 3',
          phone: '333 333-33-33',
          email: 'sidorov@mail.com',
        },
      ]);
    });

    it('should return all clients (200)', async () => {
      const res = await request(app).get('/api/clients');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(3);
    });

    it('should search clients by query (search)', async () => {
      const res = await request(app).get('/api/clients?search=петр');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].lastName).toBe('Петров');
    });

    it('should sort clients by lastName asc', async () => {
      const res = await request(app).get('/api/clients?sortBy=lastName&sortOrder=asc');
      expect(res.status).toBe(200);
      const lastNames = res.body.map(c => c.lastName);
      expect(lastNames).toEqual(['Иванов', 'Петров', 'Сидоров']);
    });

    it('should sort clients by lastName desc', async () => {
      const res = await request(app).get('/api/clients?sortBy=lastName&sortOrder=desc');
      expect(res.status).toBe(200);
      const lastNames = res.body.map(c => c.lastName);
      expect(lastNames).toEqual(['Сидоров', 'Петров', 'Иванов']);
    });
  });

  describe('GET /api/clients/:id (public)', () => {
    let clientId;

    beforeEach(async () => {
      const client = await Client.create({
        lastName: 'Тестов',
        firstName: 'Тест',
        address: 'ул. Тестовая, 10',
        phone: '999 999-99-99',
        email: 'test@test.com',
      });
      clientId = client._id;
    });

    it('should return client by id (200)', async () => {
      const res = await request(app).get(`/api/clients/${clientId}`);
      expect(res.status).toBe(200);
      expect(res.body.lastName).toBe('Тестов');
    });

    it('should return 404 if client not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/clients/${fakeId}`);
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Client not found');
    });
  });

  describe('POST /api/clients (auth required)', () => {
    beforeEach(async () => {
      user = await User.create({
        email: `post-${Date.now()}@example.com`,
        password: 'password123',
        name: 'Post Tester',
      });
      token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
    });

    const newClient = {
      lastName: 'Новый',
      firstName: 'Клиент',
      address: 'ул. Новая, 5',
      phone: '444 444-44-44',
      email: 'new@client.com',
    };

    it('should return 401 if no token', async () => {
      const res = await request(app).post('/api/clients').send(newClient);
      expect(res.status).toBe(401);
    });

    it('should return 401 if token is invalid', async () => {
      const res = await request(app)
        .post('/api/clients')
        .set('Authorization', 'Bearer invalid.token')
        .send(newClient);
      expect(res.status).toBe(401);
    });

    it('should create client with valid token and data (201)', async () => {
      const res = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${token}`)
        .send(newClient);

      expect(res.status).toBe(201);
      expect(res.body.lastName).toBe(newClient.lastName);
      expect(res.body.firstName).toBe(newClient.firstName);
      expect(res.body.createdBy.toString()).toBe(user._id.toString());

      const clientInDb = await Client.findById(res.body._id);
      expect(clientInDb).not.toBeNull();
    });

    it('should return 400 if required fields are missing', async () => {
      const incomplete = { lastName: 'Только фамилия' };
      const res = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${token}`)
        .send(incomplete);

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it('should return 400 if phone is invalid', async () => {
      const invalidPhone = { ...newClient, phone: 'abc' };
      const res = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidPhone);

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it('should return 400 if email is invalid', async () => {
      const invalidEmail = { ...newClient, email: 'not-an-email' };
      const res = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidEmail);

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe('PUT /api/clients/:id (auth required)', () => {
    let clientId;

    beforeEach(async () => {
      user = await User.create({
        email: `put-${Date.now()}@example.com`,
        password: 'password123',
        name: 'Put Tester',
      });
      token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });

      // Создаём клиента для этого пользователя
      const client = await Client.create({
        lastName: 'Старая',
        firstName: 'Запись',
        address: 'ул. Старая, 1',
        phone: '111 111-11-11',
        createdBy: user._id,
      });
      clientId = client._id;
    });

    it('should return 401 if no token', async () => {
      const res = await request(app).put(`/api/clients/${clientId}`).send({ lastName: 'Обновлено' });
      expect(res.status).toBe(401);
    });

    it('should update client with valid token and data (200)', async () => {
      const res = await request(app)
        .put(`/api/clients/${clientId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ lastName: 'Обновлено', firstName: 'Успешно' });

      expect(res.status).toBe(200);
      expect(res.body.lastName).toBe('Обновлено');
      expect(res.body.firstName).toBe('Успешно');
    });

    it('should return 404 if client not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/clients/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ lastName: 'Неважно' });

      expect(res.status).toBe(404);
    });

    it('should return 400 if phone is invalid', async () => {
      const res = await request(app)
        .put(`/api/clients/${clientId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ phone: 'invalid' });

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/clients/:id (auth required)', () => {
    let clientId;

    beforeEach(async () => {
      user = await User.create({
        email: `delete-${Date.now()}@example.com`,
        password: 'password123',
        name: 'Delete Tester',
      });
      token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });

      const client = await Client.create({
        lastName: 'Удаляемая',
        firstName: 'Запись',
        address: 'ул. Удаляемая, 1',
        phone: '000 000-00-00',
        createdBy: user._id,
      });
      clientId = client._id;
    });

    it('should return 401 if no token', async () => {
      const res = await request(app).delete(`/api/clients/${clientId}`);
      expect(res.status).toBe(401);
    });

    it('should delete client with valid token (200)', async () => {
      const res = await request(app)
        .delete(`/api/clients/${clientId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Client deleted successfully');

      const deleted = await Client.findById(clientId);
      expect(deleted).toBeNull();
    });

    it('should return 404 if client not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/clients/${fakeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });
});