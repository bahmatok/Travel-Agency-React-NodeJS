const express = require('express');
const multer = require('multer');
const auth = require('../middleware/auth');

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

router.post('/', auth, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  // В реальном приложении здесь была бы загрузка в облачное хранилище
  // Для демонстрации просто возвращаем информацию о файле
  res.json({
    message: 'File uploaded successfully',
    filename: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype
  });
});

module.exports = router;

