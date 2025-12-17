import React from 'react';
import { Link } from 'react-router-dom';
import './TourCard.css';

const TourCard = ({ tour }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getDurationText = (weeks) => {
    const weeksMap = { 1: '1 неделя', 2: '2 недели', 4: '4 недели' };
    return weeksMap[weeks] || `${weeks} недель`;
  };

  const getHotelClassText = (hotelClass) => {
    const classMap = {
      economy: 'Эконом',
      standard: 'Стандарт',
      luxury: 'Люкс',
      premium: 'Премиум'
    };
    return classMap[hotelClass] || hotelClass;
  };

  return (
    <div className="tour-card">
      <div className="tour-card-header">
        <h3 className="tour-card-title">
          {tour.destination?.city}, {tour.destination?.country}
        </h3>
        <span className={`hotel-class hotel-class-${tour.hotel?.class}`}>
          {getHotelClassText(tour.hotel?.class)}
        </span>
      </div>
      
      <div className="tour-card-body">
        <p className="tour-hotel">🏨 {tour.hotel?.name}</p>
        <p className="tour-duration">⏱️ {getDurationText(tour.duration)}</p>
        <p className="tour-departure">✈️ Отправление: {formatDate(tour.departureDate)}</p>
        {tour.destination?.climateDescription && (
          <p className="tour-climate">🌤️ {tour.destination.climateDescription}</p>
        )}
      </div>

      <div className="tour-card-footer">
        <div className="tour-price">{formatPrice(tour.price)}</div>
        <Link to={`/tour/${tour._id}`} className="tour-button">
          Подробнее
        </Link>
      </div>
    </div>
  );
};

export default TourCard;

