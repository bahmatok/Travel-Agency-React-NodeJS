const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../../server');
const Tour = require('../../models/Tour');
const Destination = require('../../models/Destination');
const User = require('../../models/User');

describe('Tours Routes', () => {
  const generateToken = (userId) => jwt.sign({ userId }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });

  describe('GET /api/tours (public)', () => {
    let destination;

    beforeEach(async () => {
      destination = await Destination.create({
        country: 'Тестовая страна',
        city: 'Тестовый город',
        climate: 'mediterranean',
        climateDescription: 'Описание',
        hotels: [{ name: 'Тест отель', class: 'standard', description: 'Описание' }],
      });

      const baseDate = new Date();
      await Tour.insertMany([
        {
          destination: destination._id,
          hotel: { name: 'Grand Hotel', class: 'luxury' },
          duration: 2,
          price: 150000,
          departureDate: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000),
          description: 'Роскошный тур',
          available: true,
        },
        {
          destination: destination._id,
          hotel: { name: 'Budget Inn', class: 'economy' },
          duration: 1,
          price: 50000,
          departureDate: new Date(baseDate.getTime() + 14 * 24 * 60 * 60 * 1000),
          description: 'Эконом тур',
          available: true,
        },
        {
          destination: destination._id,
          hotel: { name: 'Standard Plaza', class: 'standard' },
          duration: 4,
          price: 280000,
          departureDate: new Date(baseDate.getTime() + 21 * 24 * 60 * 60 * 1000),
          description: 'Стандартный тур',
          available: true,
        },
      ]);
    });

    it('should return all available tours (200)', async () => {
      const res = await request(app).get('/api/tours');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(3);
    });

    it('should filter tours by price range', async () => {
      const res = await request(app).get('/api/tours?minPrice=100000&maxPrice=200000');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].price).toBe(150000);
    });

    it('should filter tours by duration', async () => {
      const res = await request(app).get('/api/tours?duration=1');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].duration).toBe(1);
    });

    it('should search tours by description or hotel name', async () => {
      const res = await request(app).get('/api/tours?search=Роскошный');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].description).toBe('Роскошный тур');
    });

    it('should sort tours by price asc', async () => {
      const res = await request(app).get('/api/tours?sortBy=price&sortOrder=asc');
      expect(res.status).toBe(200);
      const prices = res.body.map(t => t.price);
      expect(prices).toEqual([50000, 150000, 280000]);
    });

    it('should sort tours by departureDate desc', async () => {
      const res = await request(app).get('/api/tours?sortBy=departureDate&sortOrder=desc');
      expect(res.status).toBe(200);
      const dates = res.body.map(t => new Date(t.departureDate).getTime());
      expect(dates[0]).toBeGreaterThan(dates[1]);
    });
  });

  describe('GET /api/tours/:id (public)', () => {
    let tourId, destination;

    beforeEach(async () => {
      destination = await Destination.create({
        country: 'Тестовая страна',
        city: 'Тестовый город',
        climate: 'mediterranean',
        climateDescription: 'Описание',
        hotels: [{ name: 'Тест отель', class: 'standard', description: 'Описание' }],
      });

      const tour = await Tour.create({
        destination: destination._id,
        hotel: { name: 'Unique Hotel', class: 'standard' },
        duration: 2,
        price: 120000,
        departureDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        description: 'Тестовый тур',
        available: true,
      });
      tourId = tour._id;
    });

    it('should return tour by id (200) with populated destination', async () => {
      const res = await request(app).get(`/api/tours/${tourId}`);
      expect(res.status).toBe(200);
      expect(res.body.description).toBe('Тестовый тур');
      expect(res.body.destination).toBeDefined();
      expect(res.body.destination).toHaveProperty('country', 'Тестовая страна');
    });

    it('should return 404 if tour not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/tours/${fakeId}`);
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Tour not found');
    });
  });

  describe('POST /api/tours (auth required)', () => {
    let user, token, destination;

    beforeEach(async () => {
      user = await User.create({
        email: `tour-post-${Date.now()}@example.com`,
        password: 'password123',
        name: 'Tour Post Tester',
      });
      token = generateToken(user._id);

      destination = await Destination.create({
        country: 'Страна для POST',
        city: 'Город для POST',
        climate: 'mediterranean',
        climateDescription: 'Описание',
        hotels: [{ name: 'Отель для POST', class: 'standard', description: 'Описание' }],
        createdBy: user._id,
      });
    });

    const getNewTour = () => ({
      destination: destination._id.toString(),
      hotel: { name: 'New Hotel', class: 'luxury' },
      duration: 2,
      price: 200000,
      departureDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      description: 'Новый тур',
    });

    it('should return 401 if no token', async () => {
      const res = await request(app).post('/api/tours').send(getNewTour());
      expect(res.status).toBe(401);
    });

    it('should return 401 if token is invalid', async () => {
      const res = await request(app)
        .post('/api/tours')
        .set('Authorization', 'Bearer invalid.token')
        .send(getNewTour());
      expect(res.status).toBe(401);
    });

    it('should create tour with valid token and data (201)', async () => {
      const res = await request(app)
        .post('/api/tours')
        .set('Authorization', `Bearer ${token}`)
        .send(getNewTour());

      expect(res.status).toBe(201);
      expect(res.body.hotel.name).toBe('New Hotel');
      expect(res.body.price).toBe(200000);
      expect(res.body.createdBy.toString()).toBe(user._id.toString());
      expect(res.body.destination).toBeDefined();

      const tourInDb = await Tour.findById(res.body._id);
      expect(tourInDb).not.toBeNull();
    });

    it('should return 400 if required fields are missing', async () => {
      const incomplete = { hotel: { name: 'Only hotel' } };
      const res = await request(app)
        .post('/api/tours')
        .set('Authorization', `Bearer ${token}`)
        .send(incomplete);

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it('should return 400 if duration is invalid (not 1,2,4)', async () => {
      const invalidDuration = { ...getNewTour(), duration: 3 };
      const res = await request(app)
        .post('/api/tours')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidDuration);

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it('should return 400 if hotel.class is invalid', async () => {
      const invalidClass = { ...getNewTour(), hotel: { name: 'Hotel', class: 'super' } };
      const res = await request(app)
        .post('/api/tours')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidClass);

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it('should return 400 if price is negative', async () => {
      const negativePrice = { ...getNewTour(), price: -100 };
      const res = await request(app)
        .post('/api/tours')
        .set('Authorization', `Bearer ${token}`)
        .send(negativePrice);

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe('PUT /api/tours/:id (auth required)', () => {
    let user, token, destination, tourId;

    beforeEach(async () => {
      user = await User.create({
        email: `tour-put-${Date.now()}@example.com`,
        password: 'password123',
        name: 'Tour Put Tester',
      });
      token = generateToken(user._id);

      destination = await Destination.create({
        country: 'Страна для PUT',
        city: 'Город для PUT',
        climate: 'mediterranean',
        climateDescription: 'Описание',
        hotels: [{ name: 'Отель для PUT', class: 'standard', description: 'Описание' }],
        createdBy: user._id,
      });

      const tour = await Tour.create({
        destination: destination._id,
        hotel: { name: 'Update Hotel', class: 'standard' },
        duration: 1,
        price: 80000,
        departureDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        description: 'Тур для обновления',
        createdBy: user._id,
      });
      tourId = tour._id;
    });

    it('should return 401 if no token', async () => {
      const res = await request(app).put(`/api/tours/${tourId}`).send({ price: 90000 });
      expect(res.status).toBe(401);
    });

    it('should update tour with valid token and data (200)', async () => {
      const res = await request(app)
        .put(`/api/tours/${tourId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ price: 95000, duration: 2 });

      expect(res.status).toBe(200);
      expect(res.body.price).toBe(95000);
      expect(res.body.duration).toBe(2);
    });

    it('should return 404 if tour not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/tours/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ price: 90000 });

      expect(res.status).toBe(404);
    });

    it('should return 400 if duration is invalid', async () => {
      const res = await request(app)
        .put(`/api/tours/${tourId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ duration: 3 });

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/tours/:id (auth required)', () => {
    let user, token, destination, tourId;

    beforeEach(async () => {
      user = await User.create({
        email: `tour-delete-${Date.now()}@example.com`,
        password: 'password123',
        name: 'Tour Delete Tester',
      });
      token = generateToken(user._id);

      destination = await Destination.create({
        country: 'Страна для DELETE',
        city: 'Город для DELETE',
        climate: 'mediterranean',
        climateDescription: 'Описание',
        hotels: [{ name: 'Отель для DELETE', class: 'standard', description: 'Описание' }],
        createdBy: user._id,
      });

      const tour = await Tour.create({
        destination: destination._id,
        hotel: { name: 'Delete Hotel', class: 'economy' },
        duration: 1,
        price: 50000,
        departureDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        description: 'Тур для удаления',
        createdBy: user._id,
      });
      tourId = tour._id;
    });

    it('should return 401 if no token', async () => {
      const res = await request(app).delete(`/api/tours/${tourId}`);
      expect(res.status).toBe(401);
    });

    it('should delete tour with valid token (200)', async () => {
      const res = await request(app)
        .delete(`/api/tours/${tourId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Tour deleted successfully');

      const deleted = await Tour.findById(tourId);
      expect(deleted).toBeNull();
    });

    it('should return 404 if tour not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/tours/${fakeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });
});