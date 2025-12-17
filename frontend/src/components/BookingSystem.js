import React, { Component } from 'react';
import axios from 'axios';
import './BookingSystem.css';

class BookingSystem extends Component {
  constructor(props) {
    super(props);
    this.state = {
      bookings: [],
      loading: false,
      notification: null,
      notificationTimer: null
    };
  }

  componentDidMount() {
    this.fetchBookings();
  }

  componentWillUnmount() {
    if (this.state.notificationTimer) {
      clearTimeout(this.state.notificationTimer);
    }
  }

  fetchBookings = async () => {
    try {
      this.setState({ loading: true });
      const response = await axios.get('/api/bookings');
      this.setState({ bookings: response.data, loading: false });
    } catch (error) {
      this.showNotification('Ошибка загрузки бронирований: ' + error.message, 'error');
      this.setState({ loading: false });
    }
  };

  showNotification = (message, type = 'success') => {
    this.setState({ notification: { message, type } });
    
    // Автоматическое скрытие уведомления через 3 секунды (setTimeout)
    const timer = setTimeout(() => {
      this.setState({ notification: null });
    }, 3000);
    
    this.setState({ notificationTimer: timer });
  };

  handleStatusChange = async (bookingId, newStatus) => {
    try {
      await axios.put(`/api/bookings/${bookingId}`, { status: newStatus });
      this.showNotification('Статус бронирования обновлен');
      this.fetchBookings();
    } catch (error) {
      this.showNotification('Ошибка обновления статуса: ' + error.message, 'error');
    }
  };

  handleDelete = async (bookingId) => {
    if (!window.confirm('Вы уверены, что хотите удалить это бронирование?')) {
      return;
    }

    try {
      await axios.delete(`/api/bookings/${bookingId}`);
      this.showNotification('Бронирование удалено');
      this.fetchBookings();
    } catch (error) {
      this.showNotification('Ошибка удаления: ' + error.message, 'error');
    }
  };

  render() {
    const { bookings, loading, notification } = this.state;

    return (
      <div className="booking-system">
        <h2>Система бронирования туров</h2>
        
        {notification && (
          <div className={`notification notification-${notification.type}`}>
            {notification.message}
          </div>
        )}

        {loading ? (
          <div className="loading">Загрузка...</div>
        ) : (
          <div className="bookings-list">
            {bookings.length === 0 ? (
              <div className="no-bookings">Бронирования не найдены</div>
            ) : (
              bookings.map(booking => (
                <div key={booking._id} className="booking-card">
                  <div className="booking-info">
                    <h3>Бронирование #{booking._id.slice(-6)}</h3>
                    <p><strong>Клиент:</strong> {booking.client?.lastName} {booking.client?.firstName}</p>
                    <p><strong>Туров:</strong> {booking.tours?.length || 0}</p>
                    <p><strong>Общая стоимость:</strong> {new Intl.NumberFormat('ru-RU', {
                      style: 'currency',
                      currency: 'RUB'
                    }).format(booking.totalPrice)}</p>
                    <p><strong>Статус:</strong> 
                      <span className={`status status-${booking.status}`}>
                        {booking.status}
                      </span>
                    </p>
                  </div>
                  
                  <div className="booking-actions">
                    <select
                      value={booking.status}
                      onChange={(e) => this.handleStatusChange(booking._id, e.target.value)}
                      className="status-select"
                    >
                      <option value="pending">Ожидает</option>
                      <option value="confirmed">Подтверждено</option>
                      <option value="cancelled">Отменено</option>
                      <option value="completed">Завершено</option>
                    </select>
                    <button
                      onClick={() => this.handleDelete(booking._id)}
                      className="delete-button"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  }
}

export default BookingSystem;

