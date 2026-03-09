const mongoose = require('mongoose');
const Client = require('../../models/Client');

describe('Client Model', () => {
  it('should create a client with valid data', async () => {
    const clientData = {
      lastName: 'Иванов',
      firstName: 'Иван',
      middleName: 'Иванович',
      address: 'ул. Ленина, д. 10',
      phone: '+375 (29) 123-45-67',
      email: 'ivanov@mail.ru',
    };

    const client = new Client(clientData);
    const savedClient = await client.save();

    expect(savedClient._id).toBeDefined();
    expect(savedClient.lastName).toBe(clientData.lastName);
    expect(savedClient.firstName).toBe(clientData.firstName);
    expect(savedClient.middleName).toBe(clientData.middleName);
    expect(savedClient.address).toBe(clientData.address);
    expect(savedClient.phone).toBe(clientData.phone);
    expect(savedClient.email).toBe(clientData.email);
    expect(savedClient.createdAt).toBeDefined();
    expect(savedClient.updatedAt).toBeDefined();
  });

  it('should require lastName, firstName, address and phone', async () => {
    const clientWithoutLastName = new Client({ firstName: 'Иван', address: 'ул. Ленина', phone: '+375 33' });
    await expect(clientWithoutLastName.save()).rejects.toThrow(/last name is required/i);

    const clientWithoutFirstName = new Client({ lastName: 'Иванов', address: 'ул. Ленина', phone: '+375 33' });
    await expect(clientWithoutFirstName.save()).rejects.toThrow(/first name is required/i);

    const clientWithoutAddress = new Client({ lastName: 'Иванов', firstName: 'Иван', phone: '+375 33' });
    await expect(clientWithoutAddress.save()).rejects.toThrow(/address is required/i);

    const clientWithoutPhone = new Client({ lastName: 'Иванов', firstName: 'Иван', address: 'ул. Ленина' });
    await expect(clientWithoutPhone.save()).rejects.toThrow(/phone is required/i);
  });

  it('should enforce minimum length for lastName and firstName', async () => {
    const clientShortLastName = new Client({ lastName: 'И', firstName: 'Иван', address: 'ул. Ленина', phone: '+375 33' });
    await expect(clientShortLastName.save()).rejects.toThrow(/last name must be at least 2 characters/i);

    const clientShortFirstName = new Client({ lastName: 'Иванов', firstName: 'И', address: 'ул. Ленина', phone: '+375 33' });
    await expect(clientShortFirstName.save()).rejects.toThrow(/first name must be at least 2 characters/i);
  });

  it('should validate phone number format', async () => {
    const clientInvalidPhone = new Client({
      lastName: 'Иванов',
      firstName: 'Иван',
      address: 'ул. Ленина',
      phone: 'abc123',
    });
    await expect(clientInvalidPhone.save()).rejects.toThrow(/valid phone number/i);
  });

  it('should validate email format if provided', async () => {
    const clientInvalidEmail = new Client({
      lastName: 'Иванов',
      firstName: 'Иван',
      address: 'ул. Ленина',
      phone: '+375 33',
      email: 'email',
    });
    await expect(clientInvalidEmail.save()).rejects.toThrow(/valid email/i);
  });

  it('should update updatedAt on modification', async () => {
    const client = new Client({
      lastName: 'Петров',
      firstName: 'Петр',
      address: 'ул. Пушкина',
      phone: '+375 33',
    });
    const savedClient = await client.save();
    const originalUpdatedAt = savedClient.updatedAt;

    await new Promise(resolve => setTimeout(resolve, 10));

    savedClient.address = 'Новый адрес';
    const updatedClient = await savedClient.save();

    expect(updatedClient.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });
});