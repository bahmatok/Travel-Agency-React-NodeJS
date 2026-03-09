const mongoose = require('mongoose');
const Destination = require('../../models/Destination');

describe('Destination Model', () => {
  const validDestination = {
    country: 'Испания',
    city: 'Барселона',
    climate: 'mediterranean',
    climateDescription: 'Средиземноморский климат',
    hotels: [
      { name: 'Hotel del Mar', class: 'luxury', description: 'Роскошный отель у моря' },
      { name: 'City Center', class: 'standard', description: 'Отель в центре' },
    ],
  };

  it('should create a destination with valid data', async () => {
    const destination = new Destination(validDestination);
    const savedDestination = await destination.save();

    expect(savedDestination._id).toBeDefined();
    expect(savedDestination.country).toBe(validDestination.country);
    expect(savedDestination.city).toBe(validDestination.city);
    expect(savedDestination.climate).toBe(validDestination.climate);
    expect(savedDestination.climateDescription).toBe(validDestination.climateDescription);
    expect(savedDestination.hotels).toHaveLength(2);
    expect(savedDestination.hotels[0].name).toBe(validDestination.hotels[0].name);
    expect(savedDestination.hotels[0].class).toBe(validDestination.hotels[0].class);
    expect(savedDestination.createdAt).toBeDefined();
    expect(savedDestination.updatedAt).toBeDefined();
  });

  it('should require country, city, climate and climateDescription', async () => {
    const destWithoutCountry = new Destination({ ...validDestination, country: undefined });
    await expect(destWithoutCountry.save()).rejects.toThrow(/country is required/i);

    const destWithoutCity = new Destination({ ...validDestination, city: undefined });
    await expect(destWithoutCity.save()).rejects.toThrow(/city is required/i);

    const destWithoutClimate = new Destination({ ...validDestination, climate: undefined });
    await expect(destWithoutClimate.save()).rejects.toThrow(/climate description is required/i); 

    const destWithoutClimateDesc = new Destination({ ...validDestination, climateDescription: undefined });
    await expect(destWithoutClimateDesc.save()).rejects.toThrow(/climate description is required/i);
  });

  it('should only allow specific climate values', async () => {
    const destInvalidClimate = new Destination({ ...validDestination, climate: 'invalid' });
    await expect(destInvalidClimate.save()).rejects.toThrow(/validation failed/i); 
  });

  it('should require hotel name and class for each hotel', async () => {
    const destWithInvalidHotel = new Destination({
      ...validDestination,
      hotels: [{ description: 'No name and class' }],
    });
    await expect(destWithInvalidHotel.save()).rejects.toThrow(/hotel.*name.*required/i); // Проверим, что ошибка содержит указание на name
  });

  it('should update updatedAt on modification', async () => {
    const destination = new Destination(validDestination);
    const savedDest = await destination.save();
    const originalUpdatedAt = savedDest.updatedAt;

    await new Promise(resolve => setTimeout(resolve, 10));

    savedDest.city = 'Мадрид';
    const updatedDest = await savedDest.save();

    expect(updatedDest.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });
});