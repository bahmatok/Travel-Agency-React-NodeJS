import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import TimeZoneDisplay from '../components/TimeZoneDisplay';
import DestinationFinder from '../components/DestinationFinder';
import TravelPlanner from '../components/TravelPlanner';
import './Home.css';

function Home() {
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="home">
      <section className="hero">
        <h1 className="hero-title">Добро пожаловать в Travel Agency</h1>
        <p className="hero-subtitle">
          Откройте для себя лучшие направления по всему миру
        </p>
        <Link to="/catalog" className="hero-button">
          Посмотреть туры
        </Link>
      </section>

      <section className="current-time">
        <h2>Текущее время</h2>
        <TimeZoneDisplay date={currentDate} label="Сейчас" />
      </section>

      <section className="features">
        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon">🌍</div>
            <h3>Широкий выбор</h3>
            <p>Более 50 направлений по всему миру</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🏨</div>
            <h3>Лучшие отели</h3>
            <p>Отели всех категорий от эконом до премиум</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💰</div>
            <h3>Лучшие цены</h3>
            <p>Конкурентные цены и специальные предложения</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">✈️</div>
            <h3>Удобное бронирование</h3>
            <p>Простое и быстрое оформление туров</p>
          </div>
        </div>
      </section>

      <TravelPlanner onTourSelected={(tour) => {
        window.location.href = `/tour/${tour._id}`;
      }} />

      <DestinationFinder onDestinationSelect={(destination) => {
        // Обработка выбранного направления
      }} />
    </div>
  );
}

export default Home;

