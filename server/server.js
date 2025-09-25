// server/server.js
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const cookieParser = require('cookie-parser');
require('dotenv').config();

// Import middleware
const { verifyToken } = require('./middleware/authMiddleware');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;

// --- MIDDLEWARE SETUP ---
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || origin.startsWith('http://localhost')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
};
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(cookieParser());

// --- SERVE STATIC FILES ---
app.use(express.static(path.join(__dirname, '..', 'client')));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// --- DATABASE CONNECTION POOL ---
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'ankit@54328',
    database: process.env.DB_NAME || 'alumni_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});
module.exports = pool;

// --- FILE UPLOAD (MULTER) SETUP ---
const uploadDir = path.join(__dirname, '..', 'uploads');
const resumeDir = path.join(__dirname, '..', 'uploads', 'resumes');
const chatImagesDir = path.join(__dirname, '..', 'uploads', 'chat');
fs.mkdir(uploadDir, { recursive: true }).catch(console.error);
fs.mkdir(resumeDir, { recursive: true }).catch(console.error);
fs.mkdir(chatImagesDir, { recursive: true }).catch(console.error);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'resume') {
            cb(null, resumeDir);
        } else if (file.fieldname === 'chat_image') {
            cb(null, chatImagesDir);
        } else {
            cb(null, uploadDir);
        }
    },
    filename: (req, file, cb) => {
        // Use user ID from token if available, otherwise fallback
        const userIdentifier = req.user ? req.user.userId : 'user';
        cb(null, `${file.fieldname}-${userIdentifier}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage: storage });

// --- HELPER FUNCTIONS ---
const createGlobalNotification = async (message, link) => {
    try {
        const [users] = await pool.query('SELECT user_id FROM users WHERE role != "admin"');
        const notificationPromises = users.map(user => {
            return pool.query(
                'INSERT INTO notifications (user_id, message, link) VALUES (?, ?, ?)',
                [user.user_id, message, link]
            );
        });
        await Promise.all(notificationPromises);
    } catch (error) {
        console.error('Error creating global notification:', error);
    }
};


// --- API ROUTERS ---
const adminRoutes = require('./api/admin')(pool);
const blogRoutes = require('./api/blogs')(pool);
const campaignRoutes = require('./api/campaigns')(pool);
const eventRoutes = require('./api/events')(pool, createGlobalNotification);
const jobRoutes = require('./api/jobs')(pool, upload, createGlobalNotification);
const mentorRoutes = require('./api/mentors')(pool);
const messageRoutes = require('./api/messages')(pool, upload);
const notificationRoutes = require('./api/notifications')(pool);
const userRoutes = require('./api/users')(pool, upload);

app.use('/api/admin', adminRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/mentors', mentorRoutes);
app.use('/api/messages', verifyToken, messageRoutes); // Protect all message routes
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);


// --- CENTRAL ERROR HANDLING MIDDLEWARE ---
// This middleware should be placed AFTER all your routes.
// It will catch any errors that occur in the routes above.
app.use((err, req, res, next) => {
    console.error(err.stack); // Log the full error stack for debugging
    
    // Send a generic, clean error message to the client
    res.status(500).json({ message: 'An unexpected error occurred on the server.' });
});

// --- REAL-TIME CHAT LOGIC (SOCKET.IO) ---
let onlineUsers = [];

const addUser = (userId, socketId) => {
    !onlineUsers.some(user => user.userId === userId) &&
        onlineUsers.push({ userId, socketId });
};

const removeUser = (socketId) => {
    onlineUsers = onlineUsers.filter(user => user.socketId !== socketId);
};

const getUser = (userId) => {
    return onlineUsers.find(user => user.userId === userId);
};

io.on("connection", (socket) => {
    console.log("A user connected.");

    socket.on("addUser", (userId) => {
        addUser(userId, socket.id);
        io.emit("getUsers", onlineUsers);
    });

    socket.on("sendMessage", async ({ senderId, receiverId, content, conversationId, messageType }) => {
        const user = getUser(receiverId);
        if (user) {
            io.to(user.socketId).emit("getMessage", {
                sender_id: senderId,
                content,
                created_at: new Date().toISOString(),
                conversation_id: conversationId,
                message_type: messageType,
            });

            try {
                const [sender] = await pool.query('SELECT full_name FROM users WHERE user_id = ?', [senderId]);
                if (sender.length > 0) {
                     io.to(user.socketId).emit("getNotification", {
                        senderName: sender[0].full_name,
                        message: messageType === 'text' ? content : 'Sent an image',
                    });
                }
            } catch (error) {
                console.error("Error fetching sender name for notification:", error);
            }
        }
    });
    
    socket.on("typing", ({ receiverId, isTyping }) => {
         const user = getUser(receiverId);
         if(user) {
             io.to(user.socketId).emit("getTyping", { isTyping });
         }
    });

    socket.on("disconnect", () => {
        console.log("A user disconnected.");
        removeUser(socket.id);
        io.emit("getUsers", onlineUsers);
    });
});


// --- START SERVER ---
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});