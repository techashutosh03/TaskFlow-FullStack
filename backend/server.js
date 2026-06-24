const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// ==========================================
// MIDDLEWARE
// ==========================================
app.use(cors());
app.use(express.json());

// ==========================================
// DATABASE CONNECTION
// ==========================================
mongoose.connect('mongodb://127.0.0.1:27017/todoDB')
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// ==========================================
// JWT SECRET
// ==========================================
const JWT_SECRET = 'your-super-secret-jwt-key-change-this-in-production';
const JWT_EXPIRY = '7d'; // Token expires in 7 days

// ==========================================
// USER SCHEMA
// ==========================================
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date,
        default: null
    },
    settings: {
        theme: { type: String, default: 'dark' },
        notifications: { type: Boolean, default: true }
    }
});

const User = mongoose.model('User', userSchema);

// ==========================================
// TASK SCHEMA (Updated with userId)
// ==========================================
const taskSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        enum: ['Work', 'Personal', 'Study', 'Shopping'],
        default: 'Work'
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium'
    },
    status: {
        type: String,
        enum: ['Pending', 'Completed'],
        default: 'Pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Task = mongoose.model('Task', taskSchema);

// ==========================================
// JWT VERIFICATION MIDDLEWARE
// ==========================================
const verifyToken = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                message: 'Access denied. No token provided.' 
            });
        }

        const token = authHeader.split(' ')[1];
        
        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        req.user = decoded;
        
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token.' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired. Please login again.' });
        }
        
        return res.status(500).json({ message: 'Authentication error.' });
    }
};

// ==========================================
// AUTH ROUTES
// ==========================================

// ===== REGISTER =====
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Validate input
        if (!name || !email || !password) {
            return res.status(400).json({ 
                message: 'Please provide name, email, and password' 
            });
        }
        
        if (password.length < 6) {
            return res.status(400).json({ 
                message: 'Password must be at least 6 characters' 
            });
        }
        
        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ 
                message: 'User with this email already exists' 
            });
        }
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Create user
        const user = new User({
            name,
            email: email.toLowerCase(),
            password: hashedPassword
        });
        
        await user.save();
        
        // Create JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email, name: user.name },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRY }
        );
        
        res.status(201).json({
            message: 'User registered successfully!',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// ===== LOGIN =====
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Validate input
        if (!email || !password) {
            return res.status(400).json({ 
                message: 'Please provide email and password' 
            });
        }
        
        // Find user
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ 
                message: 'Invalid email or password' 
            });
        }
        
        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ 
                message: 'Invalid email or password' 
            });
        }
        
        // Update last login
        user.lastLogin = new Date();
        await user.save();
        
        // Create JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email, name: user.name },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRY }
        );
        
        res.json({
            message: 'Login successful!',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                lastLogin: user.lastLogin
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// ===== GET CURRENT USER =====
app.get('/api/auth/me', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ===== LOGOUT (Frontend handles this) =====
app.post('/api/auth/logout', verifyToken, (req, res) => {
    // JWT is stateless, so we just respond with success
    // Frontend will remove the token
    res.json({ message: 'Logged out successfully' });
});

// ==========================================
// PROTECTED TASK ROUTES
// ==========================================

// ===== GET all tasks for current user =====
app.get('/api/tasks', verifyToken, async (req, res) => {
    try {
        const tasks = await Task.find({ userId: req.userId }).sort({ createdAt: -1 });
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ===== GET single task =====
app.get('/api/tasks/:id', verifyToken, async (req, res) => {
    try {
        const task = await Task.findOne({ 
            _id: req.params.id, 
            userId: req.userId 
        });
        
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }
        res.json(task);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ===== CREATE a new task =====
app.post('/api/tasks', verifyToken, async (req, res) => {
    try {
        const { title, category, priority, status } = req.body;
        
        if (!title) {
            return res.status(400).json({ message: 'Title is required' });
        }

        const task = new Task({
            userId: req.userId,
            title,
            category: category || 'Work',
            priority: priority || 'Medium',
            status: status || 'Pending'
        });

        const savedTask = await task.save();
        res.status(201).json(savedTask);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// ===== UPDATE a task =====
app.put('/api/tasks/:id', verifyToken, async (req, res) => {
    try {
        const { title, category, priority, status } = req.body;
        
        const task = await Task.findOne({ 
            _id: req.params.id, 
            userId: req.userId 
        });
        
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        if (title) task.title = title;
        if (category) task.category = category;
        if (priority) task.priority = priority;
        if (status) task.status = status;

        const updatedTask = await task.save();
        res.json(updatedTask);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// ===== DELETE a task =====
app.delete('/api/tasks/:id', verifyToken, async (req, res) => {
    try {
        const task = await Task.findOne({ 
            _id: req.params.id, 
            userId: req.userId 
        });
        
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        await task.deleteOne();
        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ==========================================
// HOME ROUTE
// ==========================================
app.get('/', (req, res) => {
    res.send(`
        🚀 Todo API with JWT Authentication is running!
        
        📌 Auth Endpoints:
        POST   /api/auth/register  - Register a new user
        POST   /api/auth/login     - Login user
        GET    /api/auth/me        - Get current user (Protected)
        POST   /api/auth/logout    - Logout user (Protected)
        
        📌 Task Endpoints (All Protected - Requires Token):
        GET    /api/tasks          - Get all tasks
        GET    /api/tasks/:id      - Get single task
        POST   /api/tasks          - Create a task
        PUT    /api/tasks/:id      - Update a task
        DELETE /api/tasks/:id      - Delete a task
        
        🔐 Authentication: Bearer <token> in Authorization header
    `);
});

// ==========================================
// START SERVER
// ==========================================
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📌 Auth Endpoints:`);
    console.log(`   POST   /api/auth/register  - Register`);
    console.log(`   POST   /api/auth/login     - Login`);
    console.log(`   GET    /api/auth/me        - Get user (Protected)`);
    console.log(`   POST   /api/auth/logout    - Logout (Protected)`);
    console.log(`📌 Task Endpoints (All Protected):`);
    console.log(`   GET    /api/tasks          - Get all tasks`);
    console.log(`   GET    /api/tasks/:id      - Get single task`);
    console.log(`   POST   /api/tasks          - Create a task`);
    console.log(`   PUT    /api/tasks/:id      - Update a task`);
    console.log(`   DELETE /api/tasks/:id      - Delete a task`);
});
