const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: function() {
            return !this.googleId;
        },
        minlength: [6, 'Password must be at least 6 characters']
    },
    googleId: {
        type: String,
        sparse: true
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
        // Дополнительная защита
        set: function(value) {
            // Разрешаем установить 'admin' только если это первый пользователь
            // или через специальный эндпоинт
            if (value === 'admin') {
                console.warn('Попытка установить роль admin для:', this.email);
                // Здесь можно добавить проверку прав
            }
            return value;
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Гарантируем, что новые пользователи всегда с ролью 'user'
userSchema.pre('save', async function(next) {
    if (this.isNew && this.role !== 'user') {
        console.warn(`Попытка создать пользователя ${this.email} с ролью ${this.role}. Принудительно меняем на 'user'.`);
        this.role = 'user';
    }

    if (this.isModified('password') && this.password) {
        this.password = await bcrypt.hash(this.password, 10);
    }

    this.updatedAt = Date.now();
    next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Метод для проверки, является ли пользователь админом
userSchema.methods.isAdmin = function() {
    return this.role === 'admin';
};

module.exports = mongoose.model('User', userSchema);