const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../../server');
const Booking = require('../../models/Booking');
const Client = require('../../models/Client');
const Tour = require('../../models/Tour');
const Destination = require('../../models/Destination');
const User = require('../../models/User');

describe('Bookings Routes', () => {
  const generateToken = (userId) => jwt.sign({ userId }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });

  describe('GET /api/bookings (auth required)', () => {
    let user, token, client, tour1, tour2, booking1, booking2;

    beforeEach(async () => {
      user = await User.create({
        email: `bookings-get-${Date.now()}@example.com`,
        password: 'password123',
        name: 'Bookings Tester',
      });
      token = generateToken(user._id);

      client = await Client.create({
        lastName: 'Иванов',
        firstName: 'Иван',
        address: 'ул. Ленина, 1',
        phone: '+999 111-11-11',
        createdBy: user._id,
      });

      const destination = await Destination.create({
        country: 'Страна',
        city: 'Город',
        climate: 'mediterranean',
        climateDescription: 'Описание',
        hotels: [{ name: 'Отель', class: 'standard' }],
        createdBy: user._id,
      });

      tour1 = await Tour.create({
        destination: destination._id,
        hotel: { name: 'Отель 1', class: 'standard' },
        duration: 1,
        price: 50000,
        departureDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        available: true,
        createdBy: user._id,
      });

      tour2 = await Tour.create({
        destination: destination._id,
        hotel: { name: 'Отель 2', class: 'luxury' },
        duration: 2,
        price: 150000,
        departureDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        available: true,
        createdBy: user._id,
      });

      booking1 = await Booking.create({
        client: client._id,
        tours: [{ tour: tour1._id, quantity: 2 }],
        totalPrice: tour1.price * 2,
        status: 'pending',
        createdBy: user._id,
      });

      booking2 = await Booking.create({
        client: client._id,
        tours: [
          { tour: tour1._id, quantity: 1 },
          { tour: tour2._id, quantity: 1 },
        ],
        totalPrice: tour1.price + tour2.price,
        status: 'confirmed',
        createdBy: user._id,
      });
    });

    it('should return 401 if no token', async () => {
      const res = await request(app).get('/api/bookings');
      expect(res.status).toBe(401);
    });

    it('should return 401 if token is invalid', async () => {
      const res = await request(app)
        .get('/api/bookings')
        .set('Authorization', 'Bearer invalid.token');
      expect(res.status).toBe(401);
    });

    it('should return all bookings with populated fields (200)', async () => {
      const res = await request(app)
        .get('/api/bookings')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      
      expect(res.body[0].client).toHaveProperty('lastName', 'Иванов');
      expect(res.body[0].tours[0].tour).toHaveProperty('hotel.name');
      
      const bookingWithTwoTours = res.body.find(b => b.tours.length === 2);
      expect(bookingWithTwoTours).toBeDefined();
      expect(bookingWithTwoTours.tours.length).toBe(2);
    });

    it('should filter bookings by status', async () => {
      const res = await request(app)
        .get('/api/bookings?status=confirmed')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].status).toBe('confirmed');
    });
  });

  describe('GET /api/bookings/:id (auth required)', () => {
    let user, token, client, tour, booking;

    beforeEach(async () => {
      user = await User.create({
        email: `booking-get-id-${Date.now()}@example.com`,
        password: 'password123',
        name: 'Booking Get ID',
      });
      token = generateToken(user._id);

      client = await Client.create({
        lastName: 'Петров',
        firstName: 'Петр',
        address: 'ул. Пушкина, 2',
        phone: '+999 222-22-22',
        createdBy: user._id,
      });

      const destination = await Destination.create({
        country: 'Страна',
        city: 'Город',
        climate: 'mediterranean',
        climateDescription: 'Описание',
        hotels: [{ name: 'Отель', class: 'standard' }],
        createdBy: user._id,
      });

      tour = await Tour.create({
        destination: destination._id,
        hotel: { name: 'Тестовый тур', class: 'standard' },
        duration: 1,
        price: 60000,
        departureDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        available: true,
        createdBy: user._id,
      });

      booking = await Booking.create({
        client: client._id,
        tours: [{ tour: tour._id, quantity: 1 }],
        totalPrice: 60000,
        status: 'pending',
        createdBy: user._id,
      });
    });

    it('should return 401 if no token', async () => {
      const res = await request(app).get(`/api/bookings/${booking._id}`);
      expect(res.status).toBe(401);
    });

    it('should return booking by id (200) with populated fields', async () => {
      const res = await request(app)
        .get(`/api/bookings/${booking._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.client.lastName).toBe('Петров');
      expect(res.body.tours[0].tour.hotel.name).toBe('Тестовый тур');
      expect(res.body.totalPrice).toBe(60000);
    });

    it('should return 404 if booking not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/bookings/${fakeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Booking not found');
    });
  });

  describe('POST /api/bookings (auth required)', () => {
    let user, token, client, tour1, tour2;

    beforeEach(async () => {
      user = await User.create({
        email: `booking-post-${Date.now()}@example.com`,
        password: 'password123',
        name: 'Booking Post',
      });
      token = generateToken(user._id);

      client = await Client.create({
        lastName: 'Сидоров',
        firstName: 'Сидор',
        address: 'ул. Невского, 3',
        phone: '+999 333-33-33',
        createdBy: user._id,
      });

      const destination = await Destination.create({
        country: 'Страна',
        city: 'Город',
        climate: 'mediterranean',
        climateDescription: 'Описание',
        hotels: [{ name: 'Отель', class: 'standard' }],
        createdBy: user._id,
      });

      tour1 = await Tour.create({
        destination: destination._id,
        hotel: { name: 'Тур 1', class: 'economy' },
        duration: 1,
        price: 40000,
        departureDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        available: true,
        createdBy: user._id,
      });

      tour2 = await Tour.create({
        destination: destination._id,
        hotel: { name: 'Тур 2', class: 'luxury' },
        duration: 2,
        price: 180000,
        departureDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
        available: true,
        createdBy: user._id,
      });
    });

    const getValidBooking = () => ({
      client: client._id.toString(),
      tours: [
        { tour: tour1._id.toString(), quantity: 2 },
        { tour: tour2._id.toString(), quantity: 1 },
      ],
      notes: 'Тестовое бронирование',
    });

    it('should return 401 if no token', async () => {
      const res = await request(app).post('/api/bookings').send(getValidBooking());
      expect(res.status).toBe(401);
    });

    it('should create booking with valid token and data (201)', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send(getValidBooking());

      expect(res.status).toBe(201);
      expect(res.body.client._id).toBe(client._id.toString());
      expect(res.body.tours).toHaveLength(2);
      expect(res.body.totalPrice).toBe(tour1.price * 2 + tour2.price); 
      expect(res.body.status).toBe('pending');
      expect(res.body.createdBy.toString()).toBe(user._id.toString());
      expect(res.body.notes).toBe('Тестовое бронирование');

      const bookingInDb = await Booking.findById(res.body._id);
      expect(bookingInDb).not.toBeNull();
    });

    it('should return 400 if required fields are missing', async () => {
      const incomplete = { notes: 'Только заметки' };
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send(incomplete);

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it('should return 400 if client is invalid', async () => {
      const invalidClient = { ...getValidBooking(), client: new mongoose.Types.ObjectId().toString() };
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidClient);

      expect(res.status).toBe(400);
    });

    it('should return 400 if tour is not available', async () => {
      await Tour.findByIdAndUpdate(tour1._id, { available: false });

      const bookingWithUnavailable = getValidBooking();
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send(bookingWithUnavailable);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('not available');
    });

    it('should return 400 if tour does not exist', async () => {
      const fakeTourId = new mongoose.Types.ObjectId();
      const bookingWithFakeTour = {
        ...getValidBooking(),
        tours: [{ tour: fakeTourId.toString(), quantity: 1 }],
      };
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send(bookingWithFakeTour);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('not found');
    });

    it('should return 400 if quantity is less than 1', async () => {
      const invalidQuantity = {
        ...getValidBooking(),
        tours: [{ tour: tour1._id.toString(), quantity: 0 }],
      };
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidQuantity);

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe('PUT /api/bookings/:id (auth required)', () => {
    let user, token, client, tour, booking;

    beforeEach(async () => {
      user = await User.create({
        email: `booking-put-${Date.now()}@example.com`,
        password: 'password123',
        name: 'Booking Put',
      });
      token = generateToken(user._id);

      client = await Client.create({
        lastName: 'Козлов',
        firstName: 'Козьма',
        address: 'ул. Козлова, 4',
        phone: '+999 444-44-44',
        createdBy: user._id,
      });

      const destination = await Destination.create({
        country: 'Страна',
        city: 'Город',
        climate: 'mediterranean',
        climateDescription: 'Описание',
        hotels: [{ name: 'Отель', class: 'standard' }],
        createdBy: user._id,
      });

      tour = await Tour.create({
        destination: destination._id,
        hotel: { name: 'Тур для обновления', class: 'standard' },
        duration: 1,
        price: 70000,
        departureDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
        available: true,
        createdBy: user._id,
      });

      booking = await Booking.create({
        client: client._id,
        tours: [{ tour: tour._id, quantity: 1 }],
        totalPrice: 70000,
        status: 'pending',
        createdBy: user._id,
      });
    });

    it('should return 401 if no token', async () => {
      const res = await request(app).put(`/api/bookings/${booking._id}`).send({ status: 'confirmed' });
      expect(res.status).toBe(401);
    });

    it('should update booking status with valid token (200)', async () => {
      const res = await request(app)
        .put(`/api/bookings/${booking._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'confirmed' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('confirmed');
      expect(res.body.client.lastName).toBe('Козлов'); 
    });

    it('should return 404 if booking not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/bookings/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'confirmed' });

      expect(res.status).toBe(404);
    });

    it('should return 400 if status is invalid', async () => {
      const res = await request(app)
        .put(`/api/bookings/${booking._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'invalid' });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe('DELETE /api/bookings/:id (auth required)', () => {
    let user, token, client, tour, booking;

    beforeEach(async () => {
      user = await User.create({
        email: `booking-delete-${Date.now()}@example.com`,
        password: 'password123',
        name: 'Booking Delete',
      });
      token = generateToken(user._id);

      client = await Client.create({
        lastName: 'Смирнов',
        firstName: 'Смирн',
        address: 'ул. Смирнова, 5',
        phone: '+999 555-55-55',
        createdBy: user._id,
      });

      const destination = await Destination.create({
        country: 'Страна',
        city: 'Город',
        climate: 'mediterranean',
        climateDescription: 'Описание',
        hotels: [{ name: 'Отель', class: 'standard' }],
        createdBy: user._id,
      });

      tour = await Tour.create({
        destination: destination._id,
        hotel: { name: 'Тур для удаления', class: 'standard' },
        duration: 1,
        price: 80000,
        departureDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
        available: true,
        createdBy: user._id,
      });

      booking = await Booking.create({
        client: client._id,
        tours: [{ tour: tour._id, quantity: 1 }],
        totalPrice: 80000,
        status: 'pending',
        createdBy: user._id,
      });
    });

    it('should return 401 if no token', async () => {
      const res = await request(app).delete(`/api/bookings/${booking._id}`);
      expect(res.status).toBe(401);
    });

    it('should delete booking with valid token (200)', async () => {
      const res = await request(app)
        .delete(`/api/bookings/${booking._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Booking deleted successfully');

      const deleted = await Booking.findById(booking._id);
      expect(deleted).toBeNull();
    });

    it('should return 404 if booking not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/bookings/${fakeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });
});