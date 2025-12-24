# Travel Agency Web Application

A full-stack web application for managing a travel agency business, built with React and Node.js. This application allows users to browse tours, manage clients, make bookings, and utilize AI-powered features for enhanced travel planning.

## Tech Stack

### Frontend
- **React** 18.2.0
- **React Router DOM** 6.20.1
- **Axios** 1.6.2
- **CSS3** for styling

### Backend
- **Node.js** with Express 4.18.2
- **MongoDB** with Mongoose 8.0.3
- **JWT** for authentication
- **Passport.js** with Google OAuth 2.0
- **Multer** for file uploads
- **Hugging Face Inference** API for AI image generation
- **Express Validator** for input validation

## Features

### Core Functionality
- **Tour Management**: Browse and manage travel tours with detailed information
- **Client Management**: Create, edit, and manage client profiles (authenticated users only)
- **Booking System**: Book tours with client information and status tracking
- **Destination Finder**: Search and discover travel destinations
- **Travel Planner**: Plan trips with customizable search filters
- **Catalog**: Browse tours with advanced filtering and sorting options

### Authentication & Security
- JWT-based authentication
- Google OAuth 2.0 integration
- Protected routes for authenticated users
- Password hashing with bcrypt

### AI Features
- **Image Generation**: Generate tour images using Hugging Face AI models
- Customizable image prompts for tour visualization

### Additional Features
- File upload functionality
- Time zone display
- Responsive design
- Real-time search and filtering

## Project Structure

```
LR4/
├── backend/
│   ├── middleware/
│   │   └── auth.js          # JWT authentication middleware
│   ├── models/
│   │   ├── Booking.js       # Booking model
│   │   ├── Client.js        # Client model
│   │   ├── Destination.js   # Destination model
│   │   ├── Tour.js          # Tour model
│   │   └── User.js          # User model
│   ├── routes/
│   │   ├── ai.js            # AI image generation routes
│   │   ├── auth.js          # Authentication routes
│   │   ├── bookings.js      # Booking routes
│   │   ├── clients.js       # Client routes
│   │   ├── destinations.js  # Destination routes
│   │   ├── tours.js         # Tour routes
│   │   └── upload.js        # File upload routes
│   ├── services/            # Service layer
│   ├── seed.js              # Database seeding script
│   └── server.js            # Express server entry point
├── frontend/
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── components/      # React components
│       ├── context/         # React context (AuthContext)
│       ├── pages/           # Page components
│       ├── utils/           # Utility functions
│       ├── App.js           # Main App component
│       └── index.js         # React entry point
└── package.json            # Root package.json with scripts
```

## Prerequisites

Before running the application, ensure you have the following installed:
- **Node.js** (v14 or higher)
- **npm** (v6 or higher)
- **MongoDB** (running locally or connection string)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd LR4
   ```

2. **Install all dependencies**
   ```bash
   npm run install-all
   ```
   This will install dependencies for root, backend, and frontend.

3. **Set up environment variables**
   
   Create a `.env` file in the `backend/` directory with the following variables:
   ```env
   MONGODB_URI=mongodb://localhost:27017/travel-agency
   JWT_SECRET=your-secret-key-here
   PORT=5000
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   HUGGINGFACE_API_KEY=your-huggingface-api-key
   ```

4. **Seed the database (optional)**
   ```bash
   cd backend
   node seed.js
   ```
   This will populate the database with sample destinations, tours, and an admin user.

## Running the Application

### Development Mode

Run both frontend and backend concurrently:
```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:5000`
- Frontend development server on `http://localhost:3000`

### Run Separately

**Backend only:**
```bash
npm run server
# or
cd backend && npm run dev
```

**Frontend only:**
```bash
npm run client
# or
cd frontend && npm start
```

### Production Build

Build the frontend for production:
```bash
cd frontend
npm run build
```

Start the backend in production mode:
```bash
cd backend
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/google` - Google OAuth authentication
- `GET /api/auth/callback` - OAuth callback handler

### Tours
- `GET /api/tours` - Get all tours (with optional filters)
- `GET /api/tours/:id` - Get tour by ID
- `POST /api/tours` - Create a new tour (authenticated)
- `PUT /api/tours/:id` - Update tour (authenticated)
- `DELETE /api/tours/:id` - Delete tour (authenticated)

### Clients
- `GET /api/clients` - Get all clients (authenticated)
- `GET /api/clients/:id` - Get client by ID (authenticated)
- `POST /api/clients` - Create a new client (authenticated)
- `PUT /api/clients/:id` - Update client (authenticated)
- `DELETE /api/clients/:id` - Delete client (authenticated)

### Bookings
- `GET /api/bookings` - Get all bookings (authenticated)
- `GET /api/bookings/:id` - Get booking by ID (authenticated)
- `POST /api/bookings` - Create a new booking (authenticated)
- `PUT /api/bookings/:id` - Update booking status (authenticated)
- `DELETE /api/bookings/:id` - Delete booking (authenticated)

### Destinations
- `GET /api/destinations` - Get all destinations
- `GET /api/destinations/:id` - Get destination by ID
- `POST /api/destinations` - Create destination (authenticated)

### AI
- `POST /api/ai/generate-image` - Generate tour image using AI

### Upload
- `POST /api/upload` - Upload files

## Usage

1. **Browse Tours**: Navigate to the Catalog page to view all available tours
2. **Search & Filter**: Use the search filters to find tours by destination, price, duration, etc.
3. **View Tour Details**: Click on any tour to see detailed information
4. **Generate Images**: Use the AI image generator to create custom tour images
5. **Manage Clients**: Login to access the Clients page for client management
6. **Make Bookings**: Book tours with client information through the booking system

