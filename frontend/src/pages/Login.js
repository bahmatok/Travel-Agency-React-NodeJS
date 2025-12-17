import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './Login.css';

function Login() {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: ''
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.email.trim()) {
            newErrors.email = 'Email обязателен';
        } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
            newErrors.email = 'Неверный формат email';
        }

        if (!formData.password.trim()) {
            newErrors.password = 'Пароль обязателен';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Пароль должен быть не менее 6 символов';
        }

        if (!isLogin && !formData.name.trim()) {
            newErrors.name = 'Имя обязательно';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async(e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
            const response = await axios.post(endpoint, formData);

            login(response.data.token, response.data.user);
            navigate('/');
        } catch (error) {
            setErrors({
                submit: error.response && error.response.data && error.response.data.message ?
                    error.response.data.message :
                    'Произошла ошибка'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        // Определяем URL бэкенда
        const backendUrl = process.env.NODE_ENV === 'production' ?
            'https://ваш-домен.com' // Для продакшена
            :
            'http://localhost:5000'; // Для разработки

        window.location.href = `${backendUrl}/api/auth/google`; // ✅ Абсолютный путь
    };

    return ( <
        div className = "login-page" >
        <
        div className = "login-container" >
        <
        h1 > { isLogin ? 'Вход' : 'Регистрация' } < /h1>

        <
        form onSubmit = { handleSubmit }
        className = "login-form" > {!isLogin && ( <
                div className = "form-group" >
                <
                label htmlFor = "name" > Имя: < /label> <
                input type = "text"
                id = "name"
                name = "name"
                value = { formData.name }
                onChange = { handleInputChange }
                className = { errors.name ? 'error' : '' }
                /> {
                errors.name && < span className = "error-message" > { errors.name } < /span>} < /
                div >
            )
        }

        <
        div className = "form-group" >
        <
        label htmlFor = "email" > Email: < /label> <
        input type = "email"
        id = "email"
        name = "email"
        value = { formData.email }
        onChange = { handleInputChange }
        className = { errors.email ? 'error' : '' }
        /> {
        errors.email && < span className = "error-message" > { errors.email } < /span>} < /
        div >

        <
        div className = "form-group" >
        <
        label htmlFor = "password" > Пароль: < /label> <
        input type = "password"
        id = "password"
        name = "password"
        value = { formData.password }
        onChange = { handleInputChange }
        className = { errors.password ? 'error' : '' }
        /> {
        errors.password && < span className = "error-message" > { errors.password } < /span>} < /
        div >

        {
            errors.submit && ( <
                div className = "error-message submit-error" > { errors.submit } < /div>
            )
        }

        <
        button type = "submit"
        disabled = { loading }
        className = "submit-button" > { loading ? 'Загрузка...' : (isLogin ? 'Войти' : 'Зарегистрироваться') } <
        /button> < /
        form >

        <
        div className = "divider" >
        <
        span > или < /span> < /
        div >

        <
        button onClick = { handleGoogleLogin }
        className = "google-button" >
        <
        span > 🔍 < /span> Войти через Google < /
        button >

        <
        div className = "switch-mode" >
        <
        button type = "button"
        onClick = {
            () => {
                setIsLogin(!isLogin);
                setErrors({});
                setFormData({ email: '', password: '', name: '' });
            }
        }
        className = "switch-button" > { isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти' } <
        /button> < /
        div > <
        /div> < /
        div >
    );
}

export default Login;