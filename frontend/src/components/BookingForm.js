import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './BookingForm.css';

const BookingForm = ({ tour, onClose, onSuccess }) => {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [newClient, setNewClient] = useState({
    lastName: '',
    firstName: '',
    middleName: '',
    address: '',
    phone: '',
    email: ''
  });
  const [useNewClient, setUseNewClient] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await axios.get('/api/clients');
      setClients(response.data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (useNewClient) {
      if (!newClient.lastName.trim()) newErrors.lastName = 'Фамилия обязательна';
      if (!newClient.firstName.trim()) newErrors.firstName = 'Имя обязательно';
      if (!newClient.address.trim()) newErrors.address = 'Адрес обязателен';
      if (!newClient.phone.trim()) newErrors.phone = 'Телефон обязателен';
      if (newClient.email && !/^\S+@\S+\.\S+$/.test(newClient.email)) {
        newErrors.email = 'Неверный формат email';
      }
    } else {
      if (!selectedClient) newErrors.client = 'Выберите клиента';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      let clientId = selectedClient;

      if (useNewClient) {
        const clientResponse = await axios.post('/api/clients', newClient);
        clientId = clientResponse.data._id;
      }

      await axios.post('/api/bookings', {
        client: clientId,
        tours: [{ tour: tour._id, quantity: 1 }]
      });

      onSuccess();
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Ошибка при создании бронирования: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewClient(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="booking-form-overlay" onClick={onClose}>
      <div className="booking-form-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>×</button>
        <h2>Бронирование тура</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>
              <input
                type="radio"
                checked={!useNewClient}
                onChange={() => setUseNewClient(false)}
              />
              Выбрать существующего клиента
            </label>
            <label>
              <input
                type="radio"
                checked={useNewClient}
                onChange={() => setUseNewClient(true)}
              />
              Создать нового клиента
            </label>
          </div>

          {!useNewClient ? (
            <div className="form-group">
              <label htmlFor="client">Клиент:</label>
              <select
                id="client"
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className={errors.client ? 'error' : ''}
              >
                <option value="">Выберите клиента</option>
                {clients.map(client => (
                  <option key={client._id} value={client._id}>
                    {client.lastName} {client.firstName} {client.middleName || ''} - {client.phone}
                  </option>
                ))}
              </select>
              {errors.client && <span className="error-message">{errors.client}</span>}
            </div>
          ) : (
            <>
              <div className="form-group">
                <label htmlFor="lastName">Фамилия *:</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={newClient.lastName}
                  onChange={handleInputChange}
                  className={errors.lastName ? 'error' : ''}
                />
                {errors.lastName && <span className="error-message">{errors.lastName}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="firstName">Имя *:</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={newClient.firstName}
                  onChange={handleInputChange}
                  className={errors.firstName ? 'error' : ''}
                />
                {errors.firstName && <span className="error-message">{errors.firstName}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="middleName">Отчество:</label>
                <input
                  type="text"
                  id="middleName"
                  name="middleName"
                  value={newClient.middleName}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="address">Адрес *:</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={newClient.address}
                  onChange={handleInputChange}
                  className={errors.address ? 'error' : ''}
                />
                {errors.address && <span className="error-message">{errors.address}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="phone">Телефон *:</label>
                <input
                  type="text"
                  id="phone"
                  name="phone"
                  value={newClient.phone}
                  onChange={handleInputChange}
                  className={errors.phone ? 'error' : ''}
                />
                {errors.phone && <span className="error-message">{errors.phone}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="email">Email:</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={newClient.email}
                  onChange={handleInputChange}
                  className={errors.email ? 'error' : ''}
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>
            </>
          )}

          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-button">
              Отмена
            </button>
            <button type="submit" disabled={loading} className="submit-button">
              {loading ? 'Сохранение...' : 'Забронировать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingForm;

