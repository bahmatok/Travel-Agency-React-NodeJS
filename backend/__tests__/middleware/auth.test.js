const auth = require('../../middleware/auth');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');

jest.mock('jsonwebtoken');
jest.mock('../../models/User');

describe('Auth Middleware', () => {
  let req, res, next;

  // Создаём свежие объекты req, res, next
  beforeEach(() => {
    req = {
      header: jest.fn(),
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();

    jest.clearAllMocks();
  });

  it('should return 401 if no Authorization header', async () => {
    req.header.mockReturnValue(null); // заголовок отсутствует

    await auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'No token, authorization denied' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if token is empty after Bearer', async () => {
    req.header.mockReturnValue('Bearer '); // токен пустой

    await auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'No token, authorization denied' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if token is invalid (jwt.verify throws JsonWebTokenError)', async () => {
    req.header.mockReturnValue('Bearer invalid.token');
    jwt.verify.mockImplementation(() => {
      const error = new Error('Invalid token');
      error.name = 'JsonWebTokenError';
      throw error;
    });

    await auth(req, res, next);

    expect(jwt.verify).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Invalid token',
      error: 'JsonWebTokenError',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if token is expired (TokenExpiredError)', async () => {
    req.header.mockReturnValue('Bearer expired.token');
    jwt.verify.mockImplementation(() => {
      const error = new Error('Token expired');
      error.name = 'TokenExpiredError';
      throw error;
    });

    await auth(req, res, next);

    expect(jwt.verify).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Token expired',
      error: 'TokenExpiredError',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if token is valid but user not found', async () => {
    const decoded = { userId: 'someUserId' };
    req.header.mockReturnValue('Bearer valid.token');
    jwt.verify.mockReturnValue(decoded);
    // Мокаем User.findById, чтобы вернуть null 
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    await auth(req, res, next);

    expect(jwt.verify).toHaveBeenCalled();
    expect(User.findById).toHaveBeenCalledWith(decoded.userId);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Token is not valid - user not found',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next() and set req.user if token valid and user exists', async () => {
    const decoded = { userId: 'existingUserId' };
    const mockUser = { _id: decoded.userId, email: 'test@user.com', name: 'Test' };

    req.header.mockReturnValue('Bearer valid.token');
    jwt.verify.mockReturnValue(decoded);
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser),
    });

    await auth(req, res, next);

    expect(jwt.verify).toHaveBeenCalled();
    expect(User.findById).toHaveBeenCalledWith(decoded.userId);
    expect(req.user).toEqual(mockUser);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it('should return 401 if jwt.verify throws an unknown error', async () => {
    req.header.mockReturnValue('Bearer some.token');
    jwt.verify.mockImplementation(() => {
        const error = new Error('Unknown error');
        error.name = 'SomeOtherError';
        throw error;
    });

    await auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
        message: 'Token verification failed',
        error: 'Unknown error',
    });
    expect(next).not.toHaveBeenCalled();
  });
});