import React, { useState, useEffect } from 'react';
import './TimeZoneDisplay.css';

const TimeZoneDisplay = ({ date, label = '' }) => {
  const [moscowTime, setMoscowTime] = useState('');
  const [utcTime, setUtcTime] = useState('');

  useEffect(() => {
    if (date) {
      const dateObj = new Date(date);

      // Время по UTC+3 (Москва)
      setMoscowTime(
        dateObj.toLocaleString('ru-RU', {
          timeZone: 'Europe/Minsk',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );

      // Время UTC
      setUtcTime(dateObj.toUTCString());
    }
  }, [date]);

  if (!date) return null;

  return (
    <div className="timezone-display">
      {label && <span className="timezone-label">{label}:</span>}
      <div className="timezone-info">
        <div className="timezone-item">
          <span className="timezone-type">Время UTC+3 (Минск):</span>
          <span className="timezone-value">{moscowTime}</span>
        </div>
        <div className="timezone-item">
          <span className="timezone-type">UTC:</span>
          <span className="timezone-value">{utcTime}</span>
        </div>
      </div>
    </div>
  );
};

export default TimeZoneDisplay;
