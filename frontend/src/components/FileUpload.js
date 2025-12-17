import React, { useState } from 'react';
import axios from 'axios';
import './FileUpload.css';

const FileUpload = ({ onUploadComplete }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  // Выбор файла
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setUploadStatus('');
      setUploadProgress(0);
    }
  };

  // Загрузка файла с прогрессом
  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Выберите файл');
      return;
    }

    const token = localStorage.getItem('token'); // JWT токен
    if (!token) {
      alert('Необходима авторизация для загрузки файлов');
      return;
    }

    setUploading(true);
    setUploadStatus('Загрузка...');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        onUploadProgress: (progressEvent) => {
          const progress = (progressEvent.loaded / progressEvent.total) * 100;
          setUploadProgress(progress);
        }
      });

      setUploadStatus('Файл успешно загружен!');
      setUploading(false);
      if (onUploadComplete) onUploadComplete(response.data);

    } catch (error) {
      const message = error.response?.data?.message || error.message;
      setUploadStatus('Ошибка загрузки: ' + message);
      setUploading(false);
    }
  };

  return (
    <div className="file-upload">
      <h3>Загрузка документов</h3>

      <div className="upload-controls">
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileSelect}
          className="file-input"
          disabled={uploading}
        />
        <button
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          className="upload-button"
        >
          {uploading ? 'Загрузка...' : 'Загрузить'}
        </button>
      </div>

      {uploadProgress > 0 && (
        <div className="progress-container">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <span className="progress-text">{Math.round(uploadProgress)}%</span>
        </div>
      )}

      {uploadStatus && (
        <div className={`upload-status ${uploadStatus.includes('Ошибка') ? 'error' : 'success'}`}>
          {uploadStatus}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
