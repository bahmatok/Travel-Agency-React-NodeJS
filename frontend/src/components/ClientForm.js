import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ClientForm.css';

const ClientForm = ({ client, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    lastName: '',
    firstName: '',
    middleName: '',
    address: '',
    phone: '',
    email: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (client) {
      setFormData({
        lastName: client.lastName || '',
        firstName: client.firstName || '',
        middleName: client.middleName || '',
        address: client.address || '',
        phone: client.phone || '',
        email: client.email || ''
      });
    }
  }, [client]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.lastName.trim()) newErrors.lastName = 'Фамилия обязательна';
    if (!formData.firstName.trim()) newErrors.firstName = 'Имя обязательно';
    if (!formData.address.trim()) newErrors.address = 'Адрес обязателен';
    if (!formData.phone.trim()) newErrors.phone = 'Телефон обязателен';
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Неверный формат email';
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
      if (client) {
        await axios.put(`/api/clients/${client._id}`, formData);
      } else {
        await axios.post('/api/clients', formData);
      }
      onSuccess();
    } catch (error) {
      alert('Ошибка: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="client-form-overlay" onClick={onClose}>
      <div className="client-form-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>×</button>
        <h2>{client ? 'Редактировать клиента' : 'Добавить клиента'}</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="lastName">Фамилия *:</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
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
              value={formData.firstName}
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
              value={formData.middleName}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="address">Адрес *:</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
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
              value={formData.phone}
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
              value={formData.email}
              onChange={handleInputChange}
              className={errors.email ? 'error' : ''}
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-button">
              Отмена
            </button>
            <button type="submit" disabled={loading} className="submit-button">
              {loading ? 'Сохранение...' : (client ? 'Сохранить' : 'Добавить')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientForm;

