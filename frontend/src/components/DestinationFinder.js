import React, { useReducer, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './DestinationFinder.css';

const initialState = {
  destinations: [],
  loading: false,
  error: null,
  selectedDestination: null
};

const destinationReducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_SUCCESS':
      return { ...state, loading: false, destinations: action.payload };
    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.payload };
    case 'SELECT_DESTINATION':
      return { ...state, selectedDestination: action.payload };
    default:
      return state;
  }
};

const DestinationFinder = ({ onDestinationSelect }) => {
  const [state, dispatch] = useReducer(destinationReducer, initialState);
  const [location, setLocation] = useState('');
  const { user } = useAuth();

  const handleSearch = async () => {
    if (!location.trim()) {
      alert('Введите название места');
      return;
    }

    if (!user) {
      alert('Необходима авторизация для использования AI рекомендаций');
      return;
    }

    try {
      dispatch({ type: 'FETCH_START' });

      // Берем JWT токен из localStorage
      const token = localStorage.getItem('token');

      // POST запрос к backend
      const response = await axios.post(
        '/api/ai/places',
        { location: location }, // Исправлено: отправляем location вместо preferences
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // backend возвращает results
      const data = response.data.results || [];

      dispatch({ type: 'FETCH_SUCCESS', payload: data });

    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      dispatch({ type: 'FETCH_ERROR', payload: errorMessage });
    }
  };

  const handleDestinationClick = (destination) => {
    dispatch({ type: 'SELECT_DESTINATION', payload: destination });
    if (onDestinationSelect) {
      onDestinationSelect(destination);
    }
  };

  return (
    <div className="destination-finder">
      <h3>AI Рекомендации мест</h3>
      <div className="finder-controls">
        <input
          type="text"
          placeholder="Введите название города или места..."
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          className="finder-input"
        />
        <button onClick={handleSearch} className="finder-button" disabled={state.loading}>
          {state.loading ? 'Поиск...' : 'Найти'}
        </button>
      </div>

      {state.error && <div className="error-message">{state.error}</div>}

      {state.destinations.length > 0 && (
        <div className="destinations-list">
          {state.destinations.slice(0, 5).map((place, index) => (
            <div
              key={index}
              className="destination-item"
              onClick={() => handleDestinationClick(place)}
            >
              <h4>{place.name || place.place || `Место ${index + 1}`}</h4>
              {place.description && <p>{place.description}</p>}
              {place.formatted_address && place.formatted_address !== place.description && (
                <p>📍 {place.formatted_address}</p>
              )}
              {place.reason && <p>💡 {place.reason}</p>}
              {place.rating !== null && place.rating !== undefined && (
                <p>⭐ Рейтинг: {typeof place.rating === 'number' ? place.rating.toFixed(1) : place.rating}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DestinationFinder;
