import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import TimeZoneDisplay from '../components/TimeZoneDisplay';
import BookingForm from '../components/BookingForm';
import './TourDetails.css';

function TourDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showImageGenerator, setShowImageGenerator] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [generatingImage, setGeneratingImage] = useState(false);

  useEffect(() => {
    fetchTourDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchTourDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/tours/${id}`);
      setTour(response.data);
      if (response.data.imagePrompt) {
        setImagePrompt(response.data.imagePrompt);
      } else if (response.data.destination) {
        setImagePrompt(`Beautiful travel destination ${response.data.destination.city || response.data.destination.name}, ${response.data.destination.country || ''}, travel photography`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) {
      alert('Введите описание для генерации изображения');
      return;
    }

    if (!user) {
      alert('Необходима авторизация для генерации изображений');
      return;
    }

    setGeneratingImage(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `/api/ai/generate-tour-image/${id}`,
        { prompt: imagePrompt },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Обновляем тур с новым изображением из ответа
      if (response.data.tour) {
        setTour(response.data.tour);
      } else {
        // Если в ответе нет тура, загружаем заново
        const updatedTour = await axios.get(`/api/tours/${id}`);
        setTour(updatedTour.data);
      }
      setShowImageGenerator(false);
      alert('Изображение успешно сгенерировано и сохранено!');
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      alert('Ошибка генерации изображения: ' + errorMessage);
    } finally {
      setGeneratingImage(false);
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

      {/* Отображение изображения тура */}
      {tour.generatedImage && (
        <div className="tour-image-container">
          <img src={tour.generatedImage} alt={`${tour.destination?.city || 'Tour'}`} className="tour-generated-image" />
        </div>
      )}

      <div className="tour-details-content">
        <div className="tour-info-section">
          <h2>Информация о туре</h2>
          
          {/* Кнопка генерации/перегенерации изображения */}
          {user && (
            <div className="tour-image-controls">
              {!tour.generatedImage ? (
                <button 
                  onClick={() => setShowImageGenerator(true)} 
                  className="generate-image-button"
                >
                  🖼️ Сгенерировать изображение
                </button>
              ) : (
                <button 
                  onClick={() => setShowImageGenerator(true)} 
                  className="regenerate-image-button"
                >
                  🔄 Перегенерировать изображение
                </button>
              )}
            </div>
          )}

          {/* Модальное окно для генерации изображения */}
          {showImageGenerator && user && (
            <div className="image-generator-modal">
              <div className="image-generator-modal-content">
                <button 
                  className="close-modal-button" 
                  onClick={() => setShowImageGenerator(false)}
                >
                  ×
                </button>
                <h3>Генерация изображения тура</h3>
                <textarea
                  placeholder="Опишите изображение для тура..."
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  className="image-prompt-input"
                  rows="4"
                />
                <div className="image-generator-actions">
                  <button 
                    onClick={handleGenerateImage} 
                    className="generate-button"
                    disabled={generatingImage || !imagePrompt.trim()}
                  >
                    {generatingImage ? 'Генерация...' : 'Сгенерировать'}
                  </button>
                  <button 
                    onClick={() => setShowImageGenerator(false)} 
                    className="cancel-button"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          )}
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

    </div>
  );
}

export default TourDetails;

