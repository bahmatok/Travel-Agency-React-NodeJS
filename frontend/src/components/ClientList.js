import React from 'react';
import TimeZoneDisplay from './TimeZoneDisplay';
import './ClientList.css';

const ClientList = ({ clients, onEdit, onDelete }) => {
  if (clients.length === 0) {
    return <div className="no-clients">Клиенты не найдены</div>;
  }

  return (
    <div className="client-list">
      {clients.map(client => (
        <div key={client._id} className="client-card">
          <div className="client-info">
            <h3>{client.lastName} {client.firstName} {client.middleName || ''}</h3>
            <p><strong>Адрес:</strong> {client.address}</p>
            <p><strong>Телефон:</strong> {client.phone}</p>
            {client.email && <p><strong>Email:</strong> {client.email}</p>}
          </div>

          <div className="client-dates">
            <TimeZoneDisplay date={client.createdAt} label="Создан" />
            <TimeZoneDisplay date={client.updatedAt} label="Обновлен" />
          </div>

          <div className="client-actions">
            <button onClick={() => onEdit(client)} className="edit-button">
              Редактировать
            </button>
            <button onClick={() => onDelete(client._id)} className="delete-button">
              Удалить
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ClientList;

