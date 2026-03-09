const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../../server');
const Tour = require('../../models/Tour');
const Destination = require('../../models/Destination');
const User = require('../../models/User');

// Мокаем модули для работы с AI
jest.mock('@huggingface/inference', () => {
  return {
    HfInference: jest.fn().mockImplementation(() => ({
      textToImage: jest.fn(),
    })),
    InferenceClient: jest.fn().mockImplementation(() => ({
      chatCompletion: jest.fn(),
    })),
  };
});

jest.mock('axios');

const { HfInference, InferenceClient } = require('@huggingface/inference');

describe('AI Routes', () => {
  const generateToken = (userId) => jwt.sign({ userId }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });

  describe('POST /api/ai/places', () => {
    it('should return 401 if no token', async () => {
      const res = await request(app)
        .post('/api/ai/places')
        .send({ location: 'Париж' });
      expect(res.status).toBe(401);
    });

    describe('with authentication', () => {
      let user, token;

      beforeEach(async () => {
        user = await User.create({
          email: `ai-places-${Date.now()}-${Math.random()}@example.com`,
          password: 'password123',
          name: 'AI Places Tester',
        });
        token = generateToken(user._id);

        // Устанавливаем переменные окружения для всех тестов в этом блоке
        process.env.AI_API_TYPE = 'huggingface';
        process.env.HUGGINGFACE_API_KEY = 'fake-key';
        process.env.HUGGINGFACE_MODEL = 'deepseek-ai/DeepSeek-V3.2';
        process.env.HUGGINGFACE_PROVIDER = 'novita';
        process.env.AI_MAX_TOKENS = '1000';
        process.env.AI_TEMPERATURE = '0.7';
      });

      it('should return 400 if location is missing', async () => {
        const res = await request(app)
          .post('/api/ai/places')
          .set('Authorization', `Bearer ${token}`)
          .send({});
        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Location is required');
      });

      it('should return 200 with places data when AI responds correctly', async () => {
        const mockPlacesResponse = `
          [
            {"name": "Эйфелева башня", "description": "Знаменитая башня", "reason": "Символ Парижа", "rating": 4.8},
            {"name": "Лувр", "description": "Музей искусств", "reason": "Великие произведения", "rating": 4.9}
          ]
        `;

        InferenceClient.mockImplementation(() => ({
          chatCompletion: jest.fn().mockResolvedValue({
            choices: [{ message: { content: mockPlacesResponse } }],
          }),
        }));

        const res = await request(app)
          .post('/api/ai/places')
          .set('Authorization', `Bearer ${token}`)
          .send({ location: 'Париж' });

        expect(res.status).toBe(200);
        expect(res.body.results).toBeDefined();
        expect(res.body.results.length).toBe(2);
        expect(res.body.results[0]).toHaveProperty('name', 'Эйфелева башня');
        expect(res.body.results[0]).toHaveProperty('rating', 4.8);
      });

      it('should handle AI returning invalid JSON', async () => {
        InferenceClient.mockImplementation(() => ({
          chatCompletion: jest.fn().mockResolvedValue({
            choices: [{ message: { content: 'not json' } }],
          }),
        }));

        const res = await request(app)
          .post('/api/ai/places')
          .set('Authorization', `Bearer ${token}`)
          .send({ location: 'Париж' });

        expect(res.status).toBe(500);
        expect(res.body.message).toBe('Invalid JSON received from AI');
      });

      it('should handle AI service error', async () => {
        InferenceClient.mockImplementation(() => ({
          chatCompletion: jest.fn().mockRejectedValue(new Error('Service unavailable')),
        }));

        const res = await request(app)
          .post('/api/ai/places')
          .set('Authorization', `Bearer ${token}`)
          .send({ location: 'Париж' });

        expect(res.status).toBe(500);
        expect(res.body.error).toMatch(/Service unavailable/);
      });
    });
  });

  describe('POST /api/ai/generate-tour-image/:tourId', () => {
    it('should return 401 if no token', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/ai/generate-tour-image/${fakeId}`)
        .send({ prompt: 'test prompt' });
      expect(res.status).toBe(401);
    });

    describe('with authentication', () => {
      let user, token, tour, destination;

      beforeEach(async () => {
        user = await User.create({
          email: `ai-image-${Date.now()}-${Math.random()}@example.com`,
          password: 'password123',
          name: 'AI Image Tester',
        });
        token = generateToken(user._id);

        destination = await Destination.create({
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
          price: 50000,
          departureDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          available: true,
          createdBy: user._id,
        });

        process.env.HUGGINGFACE_API_KEY = 'fake-key';
        process.env.HUGGINGFACE_IMAGE_MODEL = 'Tongyi-MAI/Z-Image-Turbo';
      });

      it('should return 400 if prompt is missing', async () => {
        const res = await request(app)
          .post(`/api/ai/generate-tour-image/${tour._id}`)
          .set('Authorization', `Bearer ${token}`)
          .send({});
        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Prompt is required');
      });

      it('should return 404 if tour not found', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app)
          .post(`/api/ai/generate-tour-image/${fakeId}`)
          .set('Authorization', `Bearer ${token}`)
          .send({ prompt: 'test prompt' });
        expect(res.status).toBe(404);
        expect(res.body.message).toBe('Tour not found');
      });

      it('should return 200 and update tour with generated image', async () => {
        const mockImageBlob = {
          arrayBuffer: jest.fn().mockResolvedValue(Buffer.from('fake-image-data')),
        };

        HfInference.mockImplementation(() => ({
          textToImage: jest.fn().mockResolvedValue(mockImageBlob),
        }));

        const res = await request(app)
          .post(`/api/ai/generate-tour-image/${tour._id}`)
          .set('Authorization', `Bearer ${token}`)
          .send({ prompt: 'beautiful beach' });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('imageUrl');
        expect(res.body.imageUrl).toMatch(/^data:image\/png;base64,/);
        expect(res.body.tour).toBeDefined();
        expect(res.body.tour.generatedImage).toBe(res.body.imageUrl);
        expect(res.body.tour.imagePrompt).toBe('beautiful beach');

        const updatedTour = await Tour.findById(tour._id);
        expect(updatedTour.generatedImage).toBe(res.body.imageUrl);
        expect(updatedTour.imagePrompt).toBe('beautiful beach');
      });

      it('should return 402 if pre-paid credits required', async () => {
        HfInference.mockImplementation(() => ({
          textToImage: jest.fn().mockRejectedValue(new Error('Pre-paid credits required for fal-ai provider')),
        }));

        const res = await request(app)
          .post(`/api/ai/generate-tour-image/${tour._id}`)
          .set('Authorization', `Bearer ${token}`)
          .send({ prompt: 'beautiful beach' });

        expect(res.status).toBe(402);
        expect(res.body.message).toMatch(/Pre-paid credits required/);
      });

      it('should return 500 if image generation fails', async () => {
        HfInference.mockImplementation(() => ({
          textToImage: jest.fn().mockRejectedValue(new Error('Generation failed')),
        }));

        const res = await request(app)
          .post(`/api/ai/generate-tour-image/${tour._id}`)
          .set('Authorization', `Bearer ${token}`)
          .send({ prompt: 'beautiful beach' });

        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Generation failed');
      });

      it('should return 413 if generated image is too large', async () => {
        const largeBuffer = Buffer.alloc(17 * 1024 * 1024);
        const mockImageBlob = {
          arrayBuffer: jest.fn().mockResolvedValue(largeBuffer),
        };

        HfInference.mockImplementation(() => ({
          textToImage: jest.fn().mockResolvedValue(mockImageBlob),
        }));

        const res = await request(app)
          .post(`/api/ai/generate-tour-image/${tour._id}`)
          .set('Authorization', `Bearer ${token}`)
          .send({ prompt: 'beautiful beach' });

        expect(res.status).toBe(413);
        expect(res.body.message).toMatch(/Image is too large/);
      });
    });
  });
});