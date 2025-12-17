import React, { useState, useEffect, useReducer } from 'react';
import axios from 'axios';
import TourCard from '../components/TourCard';
import SearchFilters from '../components/SearchFilters';
import './Catalog.css';

const catalogReducer = (state, action) => {
  switch (action.type) {
    case 'SET_TOURS':
      return { ...state, tours: action.payload, loading: false };
    case 'SET_FILTERED_TOURS':
      return { ...state, filteredTours: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
};

function Catalog() {
  const [state, dispatch] = useReducer(catalogReducer, {
    tours: [],
    filteredTours: [],
    loading: true,
    error: null
  });
  const [sortBy, setSortBy] = useState('departureDate');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filters, setFilters] = useState({
    search: '',
    minPrice: '',
    maxPrice: '',
    duration: ''
  });

  useEffect(() => {
    fetchTours();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.tours, filters, sortBy, sortOrder]);

  const fetchTours = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await axios.get('/api/tours');
      dispatch({ type: 'SET_TOURS', payload: response.data });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...state.tours];

    if (filters.search) {
      filtered = filtered.filter(tour =>
        tour.description?.toLowerCase().includes(filters.search.toLowerCase()) ||
        tour.hotel?.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        tour.destination?.city?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.minPrice) {
      filtered = filtered.filter(tour => tour.price >= Number(filters.minPrice));
    }

    if (filters.maxPrice) {
      filtered = filtered.filter(tour => tour.price <= Number(filters.maxPrice));
    }

    if (filters.duration) {
      filtered = filtered.filter(tour => tour.duration === Number(filters.duration));
    }

    filtered.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case 'price':
          aVal = a.price;
          bVal = b.price;
          break;
        case 'departureDate':
          aVal = new Date(a.departureDate);
          bVal = new Date(b.departureDate);
          break;
        default:
          aVal = a[sortBy];
          bVal = b[sortBy];
      }
      return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });

    dispatch({ type: 'SET_FILTERED_TOURS', payload: filtered });
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  const handleSortOrderChange = (e) => {
    setSortOrder(e.target.value);
  };

  if (state.loading) {
    return <div className="loading">Загрузка туров...</div>;
  }

  if (state.error) {
    return <div className="error">Ошибка: {state.error}</div>;
  }

  return (
    <div className="catalog">
      <h1 className="catalog-title">Каталог туров</h1>
      
      <SearchFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        onSortOrderChange={handleSortOrderChange}
      />

      <div className="tours-grid">
        {state.filteredTours.length > 0 ? (
          state.filteredTours.map(tour => (
            <TourCard key={tour._id} tour={tour} />
          ))
        ) : (
          <div className="no-tours">Туры не найдены</div>
        )}
      </div>
    </div>
  );
}

export default Catalog;

