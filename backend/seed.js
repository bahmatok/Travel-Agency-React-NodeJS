const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Client = require('./models/Client');
const Destination = require('./models/Destination');
const Tour = require('./models/Tour');
const User = require('./models/User');

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-agency');
    console.log('Connected to MongoDB');

    // Clear existing data
    await Client.deleteMany({});
    await Destination.deleteMany({});
    await Tour.deleteMany({});

    // Get or create admin user
    let admin = await User.findOne({ email: 'admin@travel.com' });
    if (!admin) {
      admin = new User({
        email: 'admin@travel.com',
        password: 'admin123',
        name: 'Admin User',
        role: 'admin'
      });
    }    

    // Create destinations
    const destinations = [
      {
        country: 'Турция',
        city: 'Анталия',
        climate: 'mediterranean',
        climateDescription: 'Средиземноморский климат с жарким летом и мягкой зимой',
        hotels: [
          { name: 'Grand Hotel Antalya', class: 'luxury', description: '5-звездочный отель на берегу моря' },
          { name: 'Sunset Resort', class: 'standard', description: 'Комфортабельный отель с бассейном' },
          { name: 'Beach Inn', class: 'economy', description: 'Экономичный вариант у пляжа' }
        ],
        createdBy: admin._id
      },
      {
        country: 'Египет',
        city: 'Хургада',
        climate: 'desert',
        climateDescription: 'Пустынный климат, жарко круглый год',
        hotels: [
          { name: 'Red Sea Paradise', class: 'luxury', description: 'Роскошный курорт с дайвингом' },
          { name: 'Desert Oasis', class: 'standard', description: 'Отель с аквапарком' },
          { name: 'Coral Beach', class: 'economy', description: 'Бюджетный вариант' }
        ],
        createdBy: admin._id
      },
      {
        country: 'ОАЭ',
        city: 'Дубай',
        climate: 'desert',
        climateDescription: 'Жаркий пустынный климат',
        hotels: [
          { name: 'Burj Al Arab', class: 'premium', description: 'Легендарный 7-звездочный отель' },
          { name: 'Palm Jumeirah Resort', class: 'luxury', description: 'Роскошный курорт на острове' },
          { name: 'City Center Hotel', class: 'standard', description: 'Отель в центре города' }
        ],
        createdBy: admin._id
      },
      {
        country: 'Таиланд',
        city: 'Пхукет',
        climate: 'tropical',
        climateDescription: 'Тропический климат с сезоном дождей',
        hotels: [
          { name: 'Tropical Paradise', class: 'luxury', description: 'Виллы на пляже' },
          { name: 'Bamboo Resort', class: 'standard', description: 'Эко-отель в джунглях' },
          { name: 'Beach Bungalow', class: 'economy', description: 'Бунгало у моря' }
        ],
        createdBy: admin._id
      },
      {
        country: 'Испания',
        city: 'Барселона',
        climate: 'mediterranean',
        climateDescription: 'Средиземноморский климат',
        hotels: [
          { name: 'Gothic Quarter Hotel', class: 'luxury', description: 'Отель в историческом центре' },
          { name: 'Beachfront Plaza', class: 'standard', description: 'Отель у пляжа' },
          { name: 'City Hostel', class: 'economy', description: 'Хостел в центре' }
        ],
        createdBy: admin._id
      }
    ];

    const createdDestinations = await Destination.insertMany(destinations);

    // Create tours
    const tours = [];
    const durations = [1, 2, 4];
    const basePrices = {
      economy: { 1: 50000, 2: 90000, 4: 160000 },
      standard: { 1: 80000, 2: 150000, 4: 280000 },
      luxury: { 1: 150000, 2: 280000, 4: 520000 },
      premium: { 1: 250000, 2: 480000, 4: 920000 }
    };

    for (const dest of createdDestinations) {
      for (const hotel of dest.hotels) {
        for (const duration of durations) {
          const departureDate = new Date();
          departureDate.setDate(departureDate.getDate() + Math.floor(Math.random() * 60) + 7);
          
          tours.push({
            destination: dest._id,
            hotel: {
              name: hotel.name,
              class: hotel.class
            },
            duration,
            price: basePrices[hotel.class][duration],
            departureDate,
            available: true,
            description: `${hotel.name} в ${dest.city}, ${duration} недели`,
            createdBy: admin._id
          });
        }
      }
    }

    await Tour.insertMany(tours);

    // Create sample clients
    const clients = [
      {
        lastName: 'Иванов',
        firstName: 'Иван',
        middleName: 'Иванович',
        address: 'г. Москва, ул. Ленина, д. 10',
        phone: '+7 (999) 123-45-67',
        email: 'ivanov@mail.ru',
        createdBy: admin._id
      },
      {
        lastName: 'Петрова',
        firstName: 'Мария',
        middleName: 'Сергеевна',
        address: 'г. Санкт-Петербург, Невский пр., д. 20',
        phone: '+7 (812) 234-56-78',
        email: 'petrova@mail.ru',
        createdBy: admin._id
      },
      {
        lastName: 'Сидоров',
        firstName: 'Алексей',
        address: 'г. Казань, ул. Баумана, д. 5',
        phone: '+7 (843) 345-67-89',
        createdBy: admin._id
      }
    ];

    await Client.insertMany(clients);

    console.log('Seed data created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();

