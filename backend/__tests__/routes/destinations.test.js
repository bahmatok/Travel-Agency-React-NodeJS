const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../../server');
const Destination = require('../../models/Destination');
const User = require('../../models/User');

describe('Destinations Routes', () => {
  let user, token;

  describe('GET /api/destinations (public)', () => {
    beforeEach(async () => {
      await Destination.insertMany([
        {
          country: 'Испания',
          city: 'Барселона',
          climate: 'mediterranean',
          climateDescription: 'Средиземноморский климат',
          hotels: [
            { name: 'Hotel Arts', class: 'luxury', description: 'Роскошный отель' },
            { name: 'Hostal Barcelona', class: 'economy', description: 'Бюджетный вариант' },
          ],
        },
        {
          country: 'Италия',
          city: 'Рим',
          climate: 'mediterranean',
          climateDescription: 'Теплый климат',
          hotels: [{ name: 'Grand Hotel', class: 'standard', description: 'Уютный отель' }],
        },
        {
          country: 'Таиланд',
          city: 'Пхукет',
          climate: 'tropical',
          climateDescription: 'Тропический климат',
          hotels: [{ name: 'Beach Resort', class: 'luxury', description: 'Отдых на пляже' }],
        },
      ]);
    });

    it('should return all destinations (200)', async () => {
      const res = await request(app).get('/api/destinations');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(3);
    });

    it('should search destinations by country/city/climate (search)', async () => {
      const res = await request(app).get('/api/destinations?search=итал');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].country).toBe('Италия');
    });

    it('should sort destinations by country asc', async () => {
      const res = await request(app).get('/api/destinations?sortBy=country&sortOrder=asc');
      expect(res.status).toBe(200);
      const countries = res.body.map(d => d.country);
      expect(countries).toEqual(['Испания', 'Италия', 'Таиланд']); 
    });

    it('should sort destinations by country desc', async () => {
      const res = await request(app).get('/api/destinations?sortBy=country&sortOrder=desc');
      expect(res.status).toBe(200);
      const countries = res.body.map(d => d.country);
      expect(countries).toEqual(['Таиланд', 'Италия', 'Испания']);
    });
  });

  describe('GET /api/destinations/:id (public)', () => {
    let destId;

    beforeEach(async () => {
      const dest = await Destination.create({
        country: 'Франция',
        city: 'Париж',
        climate: 'temperate',
        climateDescription: 'Умеренный климат',
        hotels: [{ name: 'Eiffel Hotel', class: 'standard', description: 'Вид на Эйфелеву башню' }],
      });
      destId = dest._id;
    });

    it('should return destination by id (200)', async () => {
      const res = await request(app).get(`/api/destinations/${destId}`);
      expect(res.status).toBe(200);
      expect(res.body.country).toBe('Франция');
      expect(res.body.city).toBe('Париж');
      expect(res.body.hotels).toHaveLength(1);
    });

    it('should return 404 if destination not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/destinations/${fakeId}`);
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Destination not found');
    });
  });

  describe('POST /api/destinations (auth required)', () => {
    beforeEach(async () => {
      user = await User.create({
        email: `dest-post-${Date.now()}@example.com`,
        password: 'password123',
        name: 'Dest Post Tester',
      });
      token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
    });

    const newDestination = {
      country: 'Греция',
      city: 'Афины',
      climate: 'mediterranean',
      climateDescription: 'Средиземноморский климат',
      hotels: [
        { name: 'Acropolis View', class: 'luxury', description: 'Вид на Акрополь' },
        { name: 'City Hostel', class: 'economy', description: 'Ночлег в центре' },
      ],
    };

    it('should return 401 if no token', async () => {
      const res = await request(app).post('/api/destinations').send(newDestination);
      expect(res.status).toBe(401);
    });

    it('should return 401 if token is invalid', async () => {
      const res = await request(app)
        .post('/api/destinations')
        .set('Authorization', 'Bearer invalid.token')
        .send(newDestination);
      expect(res.status).toBe(401);
    });

    it('should create destination with valid token and data (201)', async () => {
      const res = await request(app)
        .post('/api/destinations')
        .set('Authorization', `Bearer ${token}`)
        .send(newDestination);

      expect(res.status).toBe(201);
      expect(res.body.country).toBe(newDestination.country);
      expect(res.body.city).toBe(newDestination.city);
      expect(res.body.climate).toBe(newDestination.climate);
      expect(res.body.hotels).toHaveLength(2);
      expect(res.body.createdBy.toString()).toBe(user._id.toString());

      const destInDb = await Destination.findById(res.body._id);
      expect(destInDb).not.toBeNull();
    });

    it('should return 400 if required fields are missing', async () => {
      const incomplete = { country: 'Только страна' };
      const res = await request(app)
        .post('/api/destinations')
        .set('Authorization', `Bearer ${token}`)
        .send(incomplete);

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it('should return 400 if climate is invalid (not in enum)', async () => {
      const invalidClimate = { ...newDestination, climate: 'invalid' };
      const res = await request(app)
        .post('/api/destinations')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidClimate);

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it('should return 400 if hotel missing name or class', async () => {
      const invalidHotels = {
        ...newDestination,
        hotels: [{ description: 'Без имени и класса' }],
      };
      const res = await request(app)
        .post('/api/destinations')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidHotels);

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe('PUT /api/destinations/:id (auth required)', () => {
    let destId;

    beforeEach(async () => {
      user = await User.create({
        email: `dest-put-${Date.now()}@example.com`,
        password: 'password123',
        name: 'Dest Put Tester',
      });
      token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });

      const dest = await Destination.create({
        country: 'Германия',
        city: 'Берлин',
        climate: 'temperate',
        climateDescription: 'Умеренный климат',
        hotels: [{ name: 'Berlin Hotel', class: 'standard', description: 'В центре' }],
        createdBy: user._id,
      });
      destId = dest._id;
    });

    it('should return 401 if no token', async () => {
      const res = await request(app).put(`/api/destinations/${destId}`).send({ city: 'Мюнхен' });
      expect(res.status).toBe(401);
    });

    it('should update destination with valid token and data (200)', async () => {
      const res = await request(app)
        .put(`/api/destinations/${destId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ city: 'Мюнхен', climateDescription: 'Обновленное описание' });

      expect(res.status).toBe(200);
      expect(res.body.city).toBe('Мюнхен');
      expect(res.body.climateDescription).toBe('Обновленное описание');
    });

    it('should return 404 if destination not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/destinations/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ city: 'Неважно' });

      expect(res.status).toBe(404);
    });

    it('should return 400 if climate is invalid', async () => {
      const res = await request(app)
        .put(`/api/destinations/${destId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ climate: 'invalid' });

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/destinations/:id (auth required)', () => {
    let destId;

    beforeEach(async () => {
      user = await User.create({
        email: `dest-delete-${Date.now()}@example.com`,
        password: 'password123',
        name: 'Dest Delete Tester',
      });
      token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });

      const dest = await Destination.create({
        country: 'Португалия',
        city: 'Лиссабон',
        climate: 'mediterranean',
        climateDescription: 'Мягкий климат',
        hotels: [{ name: 'Lisbon Inn', class: 'economy', description: 'Уютно' }],
        createdBy: user._id,
      });
      destId = dest._id;
    });

    it('should return 401 if no token', async () => {
      const res = await request(app).delete(`/api/destinations/${destId}`);
      expect(res.status).toBe(401);
    });

    it('should delete destination with valid token (200)', async () => {
      const res = await request(app)
        .delete(`/api/destinations/${destId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Destination deleted successfully');

      const deleted = await Destination.findById(destId);
      expect(deleted).toBeNull();
    });

    it('should return 404 if destination not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/destinations/${fakeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });
});