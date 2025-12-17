// Скрипт для проверки загрузки переменных окружения
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

const envPath = path.join(__dirname, '.env');

console.log('=== Проверка переменных окружения ===\n');
console.log('Текущая директория:', __dirname);
console.log('Путь к .env файлу:', envPath);
console.log('Файл существует:', fs.existsSync(envPath));

if (fs.existsSync(envPath)) {
  console.log('Размер файла:', fs.statSync(envPath).size, 'байт');
  const content = fs.readFileSync(envPath, 'utf8');
  const lines = content.split('\n').filter(line => line.trim() && !line.trim().startsWith('#'));
  console.log('Всего строк (без комментариев):', lines.length);
  console.log('\nСодержимое файла (первые 10 строк):');
  lines.slice(0, 10).forEach((line, index) => {
    const key = line.split('=')[0]?.trim();
    const hasValue = line.includes('=') && line.split('=')[1]?.trim();
    console.log(`  ${index + 1}. ${key}: ${hasValue ? '✓ есть значение' : '✗ нет значения'}`);
  });
}

// Загружаем .env файл
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('\n❌ Ошибка загрузки .env:', result.error.message);
} else {
  console.log('\n✓ .env файл загружен успешно');
}

console.log('\nПеременные окружения:');
console.log('  POE_API_KEY:', process.env.POE_API_KEY ? `✓ Установлен (длина: ${process.env.POE_API_KEY.length})` : '✗ Не установлен');
console.log('  POE_MODEL:', process.env.POE_MODEL || 'не установлен (будет использован claude-3-opus)');
console.log('  POE_API_URL:', process.env.POE_API_URL || 'не установлен (будет использован https://api.poe.com/v1/chat)');
console.log('  OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? `✓ Установлен (длина: ${process.env.OPENAI_API_KEY.length})` : '✗ Не установлен');
console.log('  MONGODB_URI:', process.env.MONGODB_URI ? '✓ Установлен' : '✗ Не установлен');
console.log('  JWT_SECRET:', process.env.JWT_SECRET ? '✓ Установлен' : '✗ Не установлен');

console.log('\nВсе переменные с POE:');
Object.keys(process.env)
  .filter(key => key.includes('POE'))
  .forEach(key => {
    const value = process.env[key];
    console.log(`  ${key}: ${value ? `✓ "${value.substring(0, 20)}..."` : '✗ пусто'}`);
  });

