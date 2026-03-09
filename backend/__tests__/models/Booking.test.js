const mongoose = require('mongoose');
const Booking = require('../../models/Booking');
const Client = require('../../models/Client');
const Tour = require('../../models/Tour');
const Destination = require('../../models/Destination');

describe('Booking Model', () => {
  let clientId, tourId;

  beforeAll(async () => {
    const client = new Client({
      lastName: 'Тест',
      firstName: 'Тест',
      address: 'Тест',
      phone: '+375 33',
    });
    const savedClient = await client.save();
    clientId = savedClient._id;

    const destination = new Destination({
      country: 'Страна',
      city: 'Город',
      climate: 'mediterranean',
      climateDescription: 'Описание',
      hotels: [{ name: 'Отель', class: 'standard' }],
    });
    const savedDest = await destination.save();

    const tour = new Tour({
      destination: savedDest._id,
      hotel: { name: 'Отель', class: 'standard' },
      duration: 1,
      price: 50000,
      departureDate: new Date(),
    });
    const savedTour = await tour.save();
    tourId = savedTour._id;
  });

  const validBooking = (overrides = {}) => ({
    client: clientId,
    tours: [{ tour: tourId, quantity: 2 }],
    totalPrice: 100000,
    notes: 'Тестовое бронирование',
    ...overrides,
  });

  it('should create a booking with valid data', async () => {
    const booking = new Booking(validBooking());
    const savedBooking = await booking.save();

    expect(savedBooking._id).toBeDefined();
    expect(savedBooking.client.toString()).toBe(clientId.toString());
    expect(savedBooking.tours).toHaveLength(1);
    expect(savedBooking.tours[0].tour.toString()).toBe(tourId.toString());
    expect(savedBooking.tours[0].quantity).toBe(2);
    expect(savedBooking.totalPrice).toBe(100000);
    expect(savedBooking.status).toBe('pending'); // default
    expect(savedBooking.notes).toBe('Тестовое бронирование');
    expect(savedBooking.createdAt).toBeDefined();
    expect(savedBooking.updatedAt).toBeDefined();
  });

  it('should require client, tours, totalPrice', async () => {
    const requiredFields = ['client', 'tours', 'totalPrice'];
    for (const field of requiredFields) {
      const bookingData = validBooking();
      delete bookingData[field];
      const booking = new Booking(bookingData);
      await expect(booking.save()).rejects.toThrow(/required/i);
    }
  });

  it('should set status to pending by default', async () => {
    const booking = new Booking(validBooking());
    expect(booking.status).toBe('pending');
  });

  it('should only allow specific status values', async () => {
    const bookingInvalidStatus = new Booking(validBooking({ status: 'unknown' }));
    await expect(bookingInvalidStatus.save()).rejects.toThrow(/validation failed/i);
  });

  it('should enforce min quantity = 1', async () => {
    const bookingInvalidQuantity = new Booking(validBooking({ tours: [{ tour: tourId, quantity: 0 }] }));
    await expect(bookingInvalidQuantity.save()).rejects.toThrow(/validation failed/i);
  });

  it('should enforce totalPrice >= 0', async () => {
    const bookingNegativePrice = new Booking(validBooking({ totalPrice: -10 }));
    await expect(bookingNegativePrice.save()).rejects.toThrow(/total price must be positive/i);
  });

  it('should update updatedAt on modification', async () => {
    const booking = new Booking(validBooking());
    const savedBooking = await booking.save();
    const originalUpdatedAt = savedBooking.updatedAt;

    await new Promise(resolve => setTimeout(resolve, 10));

    savedBooking.notes = 'Обновлённые заметки';
    const updatedBooking = await savedBooking.save();

    expect(updatedBooking.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });
});