const mongoose = require('mongoose');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');

describe('User Model', () => {
  it('should create a user with valid data', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    };

    const user = new User(userData);
    const savedUser = await user.save();

    expect(savedUser._id).toBeDefined();
    expect(savedUser.email).toBe(userData.email);
    expect(savedUser.name).toBe(userData.name);
    expect(savedUser.password).not.toBe(userData.password); // пароль должен быть захэширован
    expect(savedUser.role).toBe('user'); // роль по умолчанию
    expect(savedUser.createdAt).toBeDefined();
    expect(savedUser.updatedAt).toBeDefined();
  });

  it('should hash password before saving', async () => {
    const plainPassword = 'securePass';
    const user = new User({
      email: 'hash@test.com',
      password: plainPassword,
      name: 'Hash Test',
    });

    await user.save();

    expect(user.password).not.toBe(plainPassword);

    const isMatch = await bcrypt.compare(plainPassword, user.password);
    expect(isMatch).toBe(true);
  });

  it('should correctly compare passwords', async () => {
    const user = new User({
      email: 'compare@test.com',
      password: 'myPassword',
      name: 'Compare Test',
    });
    await user.save();

    const isCorrect = await user.comparePassword('myPassword');
    expect(isCorrect).toBe(true);

    const isWrong = await user.comparePassword('wrong');
    expect(isWrong).toBe(false);
  });

  it('should require email, name and password (if no googleId)', async () => {
    const userWithoutEmail = new User({ name: 'No Email', password: '123456' });
    await expect(userWithoutEmail.save()).rejects.toThrow();

    const userWithoutName = new User({ email: 'noname@test.com', password: '123456' });
    await expect(userWithoutName.save()).rejects.toThrow();

    const userWithoutPassword = new User({ email: 'nopass@test.com', name: 'No Pass' });
    await expect(userWithoutPassword.save()).rejects.toThrow();
  });

  it('should not allow duplicate emails', async () => {
    const user1 = new User({ email: 'duplicate@test.com', password: 'pass123', name: 'User1' });
    await user1.save();

    const user2 = new User({ email: 'duplicate@test.com', password: 'pass321', name: 'User2' });
    await expect(user2.save()).rejects.toThrow(/duplicate key/);
  });

  it('should ensure minimum password length', async () => {
    const user = new User({
      email: 'short@test.com',
      password: '12345', 
      name: 'Short Password',
    });

    await expect(user.save()).rejects.toThrow(/Password must be at least 6 characters/);
  });

  it('should default role to user, even if admin is set on creation', async () => {
    const user = new User({
      email: 'adminwannabe@test.com',
      password: '123456',
      name: 'Admin Wannabe',
      role: 'admin',
    });

    const savedUser = await user.save();
    expect(savedUser.role).toBe('user'); 
  });

  it('should allow user with googleId to have no password', async () => {
    const user = new User({
      email: 'google@test.com',
      googleId: '12345',
      name: 'Google User',
    });

    const savedUser = await user.save();
    expect(savedUser.googleId).toBe('12345');
    expect(savedUser.password).toBeUndefined(); 
  });

  it('should update updatedAt on document modification', async () => {
    const user = new User({
      email: 'update@test.com',
      password: '123456',
      name: 'Update Test',
    });
    const savedUser = await user.save();
    const originalUpdatedAt = savedUser.updatedAt;

    await new Promise(resolve => setTimeout(resolve, 10));

    savedUser.name = 'New Name';
    const updatedUser = await savedUser.save();

    expect(updatedUser.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should correctly identify admin role', () => {
    const user = new User({
        email: 'admin@test.com',
        password: 'adminpass',
        name: 'Admin',
        role: 'admin'
    });
    // не сохраняем, middleware pre('save') не выполняется, роль остается admin
    expect(user.isAdmin()).toBe(true);
  });
});