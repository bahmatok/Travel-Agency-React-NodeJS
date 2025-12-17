import React, { useState } from 'react';
import { findAndBookTour } from '../utils/tourBooking';
import './TravelPlanner.css';

const TravelPlanner = ({ onTourSelected }) => {
  const [criteria, setCriteria] = useState({
    search: '',
    minPrice: '',
    maxPrice: '',
    duration: '',
    quantity: 1
  });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCriteria(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = async () => {
    setLoading(true);
    setResults(null);

    try {
      const result = await findAndBookTour(criteria);
      setResults(result);
      
      if (result.success && result.bestOption && onTourSelected) {
        onTourSelected(result.bestOption);
      }
    } catch (error) {
      setResults({
        success: false,
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="travel-planner">
      <h3>Планирование маршрута (Promise цепочка)</h3>
      
      <div className="planner-form">
        <input
          type="text"
          name="search"
          placeholder="Поиск..."
          value={criteria.search}
          onChange={handleInputChange}
          className="planner-input"
        />
        <input
          type="number"
          name="minPrice"
          placeholder="Мин. цена"
          value={criteria.minPrice}
          onChange={handleInputChange}
          className="planner-input"
        />
        <input
          type="number"
          name="maxPrice"
          placeholder="Макс. цена"
          value={criteria.maxPrice}
          onChange={handleInputChange}
          className="planner-input"
        />
        <select
          name="duration"
          value={criteria.duration}
          onChange={handleInputChange}
          className="planner-select"
        >
          <option value="">Все длительности</option>
          <option value="1">1 неделя</option>
          <option value="2">2 недели</option>
          <option value="4">4 недели</option>
        </select>
        <button
          onClick={handleSearch}
          disabled={loading}
          className="planner-button"
        >
          {loading ? 'Поиск...' : 'Найти тур'}
        </button>
      </div>

      {results && (
        <div className={`planner-results ${results.success ? 'success' : 'error'}`}>
          {results.success ? (
            <>
              <h4>Найдено туров: {results.tours.length}</h4>
              {results.bestOption && (
                <div className="best-option">
                  <h5>Лучший вариант:</h5>
                  <p>{results.bestOption.destination?.city}, {results.bestOption.destination?.country}</p>
                  <p>Цена: {new Intl.NumberFormat('ru-RU', {
                    style: 'currency',
                    currency: 'RUB'
                  }).format(results.bestOption.totalPrice)}</p>
                </div>
              )}
            </>
          ) : (
            <p>Ошибка: {results.error}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default TravelPlanner;

