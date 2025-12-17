import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navigation.css';

function Navigation() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navigation">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          ✈️ Travel Agency
        </Link>
        <ul className="nav-menu">
          <li>
            <Link to="/" className="nav-link">Главная</Link>
          </li>
          <li>
            <Link to="/catalog" className="nav-link">Каталог</Link>
          </li>
          {user && (
            <li>
              <Link to="/clients" className="nav-link">Клиенты</Link>
            </li>
          )}
          {user ? (
            <li>
              <button onClick={handleLogout} className="nav-button">
                Выйти
              </button>
            </li>
          ) : (
            <li>
              <Link to="/login" className="nav-link nav-link-button">
                Войти
              </Link>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
}

export default Navigation;

