import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './ImageGenerator.css';

const ImageGenerator = ({ destination, onImageGenerated }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (destination) {
      setPrompt(`Beautiful travel destination ${destination.city || destination.name}, ${destination.country || ''}, travel photography`);
    }
  }, [destination]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert('Введите описание для генерации изображения');
      return;
    }

    if (!user) {
      alert('Необходима авторизация для генерации изображений');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/ai/generate-image', { prompt });
      setGeneratedImage(response.data.imageUrl);
      if (onImageGenerated) {
        onImageGenerated(response.data.imageUrl);
      }
    } catch (error) {
      alert('Ошибка генерации изображения: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="image-generator">
      <h3>Генерация изображения направления (DALL-E)</h3>
      <div className="generator-controls">
        <input
          type="text"
          placeholder="Опишите изображение..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="generator-input"
        />
        <button onClick={handleGenerate} className="generator-button" disabled={loading}>
          {loading ? 'Генерация...' : 'Сгенерировать'}
        </button>
      </div>

      {generatedImage && (
        <div className="generated-image-container">
          <img src={generatedImage} alt="Generated" className="generated-image" />
        </div>
      )}
    </div>
  );
};

export default ImageGenerator;

