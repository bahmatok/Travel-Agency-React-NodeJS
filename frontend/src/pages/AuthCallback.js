import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function AuthCallback() {
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      login(token, { token });
      navigate('/');
    } else {
      navigate('/login');
    }
  }, [searchParams, login, navigate]);

  return <div>Авторизация...</div>;
}

export default AuthCallback;

