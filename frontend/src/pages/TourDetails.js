import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import TimeZoneDisplay from '../components/TimeZoneDisplay';
import BookingForm from '../components/BookingForm';
import ImageGenerator from '../components/ImageGenerator';
import FileUpload from '../components/FileUpload';
import './TourDetails.css';

function TourDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);

  useEffect(() => {
    fetchTourDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchTourDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/tours/${id}`);
      setTour(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBookClick = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setShowBookingForm(true);
  };

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

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  if (error || !tour) {
    return <div className="error">Ошибка: {error || 'Тур не найден'}</div>;
  }

  return (
    <div className="tour-details">
      <button onClick={() => navigate(-1)} className="back-button">
        ← Назад
      </button>

      <div className="tour-details-header">
        <h1>{tour.destination?.city}, {tour.destination?.country}</h1>
        <div className="tour-price-large">{formatPrice(tour.price)}</div>
      </div>

      <div className="tour-details-content">
        <div className="tour-info-section">
          <h2>Информация о туре</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Отель:</span>
              <span className="info-value">{tour.hotel?.name}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Класс отеля:</span>
              <span className="info-value">{tour.hotel?.class}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Длительность:</span>
              <span className="info-value">{tour.duration} недели</span>
            </div>
            <div className="info-item">
              <span className="info-label">Дата отправления:</span>
              <span className="info-value">{formatDate(tour.departureDate)}</span>
            </div>
          </div>

          {tour.destination && (
            <div className="destination-info">
              <h3>О направлении</h3>
              <p><strong>Страна:</strong> {tour.destination.country}</p>
              <p><strong>Город:</strong> {tour.destination.city}</p>
              <p><strong>Климат:</strong> {tour.destination.climateDescription}</p>
            </div>
          )}

          {tour.description && (
            <div className="tour-description">
              <h3>Описание</h3>
              <p>{tour.description}</p>
            </div>
          )}

          <TimeZoneDisplay date={tour.createdAt} label="Дата создания" />
          <TimeZoneDisplay date={tour.updatedAt} label="Дата обновления" />
        </div>

        <div className="tour-actions">
          {tour.available ? (
            <button onClick={handleBookClick} className="book-button">
              Забронировать тур
            </button>
          ) : (
            <div className="unavailable">Тур недоступен</div>
          )}
        </div>
      </div>

      {showBookingForm && user && (
        <BookingForm
          tour={tour}
          onClose={() => setShowBookingForm(false)}
          onSuccess={() => {
            setShowBookingForm(false);
            alert('Тур успешно забронирован!');
          }}
        />
      )}

      {user && (
        <>
          <ImageGenerator 
            destination={tour.destination}
            onImageGenerated={(imageUrl) => {
              console.log('Generated image:', imageUrl);
            }}
          />
          <FileUpload onUploadComplete={(response) => {
            console.log('File uploaded:', response);
          }} />
        </>
      )}
    </div>
  );
}

export default TourDetails;

