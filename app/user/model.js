const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    full_name: {
        type: String,
        required: [true, 'Nama harus diisi'],
        maxlength: [255, 'Panjang nama harus antara 3 - 255 karakter'],
        minlength: [3, 'Panjang nama harus antara 3 - 255 karakter']
    },

    customer_id: {
        type: Number,
    },

    email: {
        type: String,
        required: [true, 'Email harus diisi'],
        maxlength: [255, 'Panjang email maksimal 255 karakter'],
        validate: {
            validator: function(value) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
            },
            message: 'Format email tidak valid',
        }
    },

    password: {
        type: String,
        required: [true, 'Password harus diisi'],
        maxlength: [255, 'Panjang password maksimal 255 karakter'], 
    },

    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },

    token: [String]

}, { timestamps: true });


userSchema.pre('save', async function(next) {
    try {
        const existingUser = await User.findOne({ email: this.email });

        if (existingUser) {
            const error = new Error('Email sudah terdaftar');
            error.name = 'ValidationError';
            error.errors = {
                email: {
                    message: 'Email sudah terdaftar',
                    kind: 'unique',
                    path: 'email',
                    value: this.email,
                },
            };
            throw error;
        }

        if (this.isModified('password')) {
            const hashedPassword = await bcrypt.hash(this.password, 10);
            this.password = hashedPassword;
        }

        next();
    } catch (error) {
        next(error);
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
