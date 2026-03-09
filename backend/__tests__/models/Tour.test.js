const mongoose = require('mongoose');
const Tour = require('../../models/Tour');
const Destination = require('../../models/Destination');

describe('Tour Model', () => {
  let destinationId;

  beforeAll(async () => {
    const destination = new Destination({
      country: 'Тест',
      city: 'Тест',
      climate: 'mediterranean',
      climateDescription: 'Тест',
      hotels: [{ name: 'Тест', class: 'standard' }],
    });
    const savedDest = await destination.save();
    destinationId = savedDest._id;
  });

  const validTour = (overrides = {}) => ({
    destination: destinationId,
    hotel: { name: 'Grand Hotel', class: 'luxury' },
    duration: 2,
    price: 150000,
    departureDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // через неделю
    description: 'Отличный тур',
    ...overrides,
  });

  it('should create a tour with valid data', async () => {
    const tour = new Tour(validTour());
    const savedTour = await tour.save();

    expect(savedTour._id).toBeDefined();
    expect(savedTour.destination.toString()).toBe(destinationId.toString());
    expect(savedTour.hotel.name).toBe('Grand Hotel');
    expect(savedTour.hotel.class).toBe('luxury');
    expect(savedTour.duration).toBe(2);
    expect(savedTour.price).toBe(150000);
    expect(savedTour.departureDate).toBeDefined();
    expect(savedTour.available).toBe(true); // default
    expect(savedTour.description).toBe('Отличный тур');
    expect(savedTour.createdAt).toBeDefined();
    expect(savedTour.updatedAt).toBeDefined();
  });

  it('should require destination, hotel, duration, price, departureDate', async () => {
    const requiredFields = ['destination', 'hotel', 'duration', 'price', 'departureDate'];
    for (const field of requiredFields) {
      const tourData = validTour();
      delete tourData[field];
      const tour = new Tour(tourData);
      await expect(tour.save()).rejects.toThrow(/required/i);
    }
  });

  it('should only allow duration values 1,2,4', async () => {
    const tourInvalidDuration = new Tour(validTour({ duration: 3 }));
    await expect(tourInvalidDuration.save()).rejects.toThrow(/duration must be 1, 2, or 4 weeks/i);
  });

  it('should only allow hotel.class values from enum', async () => {
    const tourInvalidHotelClass = new Tour(validTour({ hotel: { name: 'Test', class: 'super' } }));
    await expect(tourInvalidHotelClass.save()).rejects.toThrow(/validation failed/i);
  });

  it('should enforce price >= 0', async () => {
    const tourNegativePrice = new Tour(validTour({ price: -100 }));
    await expect(tourNegativePrice.save()).rejects.toThrow(/price must be positive/i);
  });

  it('should set available to true by default', async () => {
    const tour = new Tour(validTour());
    expect(tour.available).toBe(true);
  });

  it('should update updatedAt on modification', async () => {
    const tour = new Tour(validTour());
    const savedTour = await tour.save();
    const originalUpdatedAt = savedTour.updatedAt;

    await new Promise(resolve => setTimeout(resolve, 10));

    savedTour.price = 200000;
    const updatedTour = await savedTour.save();

    expect(updatedTour.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });
});