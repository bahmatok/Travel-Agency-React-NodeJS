import React from 'react';
import './SearchFilters.css';

const SearchFilters = ({ filters, onFilterChange, sortBy, sortOrder, onSortChange, onSortOrderChange }) => {
  const handleInputChange = (e) => {
    onFilterChange(e.target.name, e.target.value);
  };

  return (
    <div className="search-filters">
      <div className="filters-row">
        <input
          type="text"
          name="search"
          placeholder="Поиск по названию, отелю, городу..."
          value={filters.search}
          onChange={handleInputChange}
          className="filter-input"
        />
        
        <input
          type="number"
          name="minPrice"
          placeholder="Мин. цена"
          value={filters.minPrice}
          onChange={handleInputChange}
          className="filter-input filter-input-number"
        />
        
        <input
          type="number"
          name="maxPrice"
          placeholder="Макс. цена"
          value={filters.maxPrice}
          onChange={handleInputChange}
          className="filter-input filter-input-number"
        />
        
        <select
          name="duration"
          value={filters.duration}
          onChange={handleInputChange}
          className="filter-select"
        >
          <option value="">Все длительности</option>
          <option value="1">1 неделя</option>
          <option value="2">2 недели</option>
          <option value="4">4 недели</option>
        </select>
      </div>

      <div className="sort-row">
        <label htmlFor="sortBy">Сортировать по:</label>
        <select
          id="sortBy"
          value={sortBy}
          onChange={onSortChange}
          className="sort-select"
        >
          <option value="departureDate">Дате отправления</option>
          <option value="price">Цене</option>
          <option value="duration">Длительности</option>
        </select>
        
        <select
          value={sortOrder}
          onChange={onSortOrderChange}
          className="sort-select"
        >
          <option value="asc">По возрастанию</option>
          <option value="desc">По убыванию</option>
        </select>
      </div>
    </div>
  );
};

export default SearchFilters;

