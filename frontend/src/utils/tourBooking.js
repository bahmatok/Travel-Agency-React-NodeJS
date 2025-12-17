// Promise цепочка для подбора тура
export const findAndBookTour = async (criteria) => {
  try {
    // Шаг 1: Поиск вариантов туров
    const searchResponse = await fetch('/api/tours?' + new URLSearchParams({
      search: criteria.search || '',
      minPrice: criteria.minPrice || '',
      maxPrice: criteria.maxPrice || '',
      duration: criteria.duration || ''
    }));
    
    if (!searchResponse.ok) {
      throw new Error('Ошибка поиска туров');
    }
    
    const tours = await searchResponse.json();
    
    if (tours.length === 0) {
      throw new Error('Туры не найдены');
    }

    // Шаг 2: Проверка доступности (availability)
    const availableTours = await Promise.all(
      tours.map(async (tour) => {
        // В реальном приложении здесь была бы проверка доступности
        // Для демонстрации просто проверяем флаг available
        if (!tour.available) {
          return null;
        }
        
        // Дополнительная проверка даты
        const departureDate = new Date(tour.departureDate);
        if (departureDate < new Date()) {
          return null;
        }
        
        return tour;
      })
    );

    const filteredTours = availableTours.filter(tour => tour !== null);

    if (filteredTours.length === 0) {
      throw new Error('Нет доступных туров');
    }

    // Шаг 3: Расчет стоимости
    const toursWithTotal = filteredTours.map(tour => ({
      ...tour,
      totalPrice: tour.price * (criteria.quantity || 1)
    }));

    // Сортировка по цене
    toursWithTotal.sort((a, b) => a.totalPrice - b.totalPrice);

    return {
      success: true,
      tours: toursWithTotal,
      bestOption: toursWithTotal[0]
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

