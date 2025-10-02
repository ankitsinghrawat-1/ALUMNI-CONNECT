// server/server.js
require('dotenv').config();
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

const { verifyToken } = require('./middleware/authMiddleware');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

const PORT = process.env.PORT || 3000;

const corsOptions = {
    origin: function (origin, callback) {
        // For production, you should have a whitelist of allowed domains
        const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001'];
        if (!origin || allowedOrigins.includes(origin)) {
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

app.use(express.static(path.join(__dirname, '..', 'client')));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});
module.exports = pool;

// --- FILE UPLOAD (MULTER) SETUP ---
const uploadDir = path.join(__dirname, '..', 'uploads');
const resumeDir = path.join(__dirname, '..', 'uploads', 'resumes');
const chatImagesDir = path.join(__dirname, '..', 'uploads', 'chat');
const blogImagesDir = path.join(__dirname, '..', 'uploads', 'blogs');
const groupImagesDir = path.join(__dirname, '..', 'uploads', 'groups');
const threadsDir = path.join(__dirname, '..', 'uploads', 'threads');
const storiesDir = path.join(__dirname, '..', 'uploads', 'stories');

fs.mkdir(uploadDir, { recursive: true }).catch(console.error);
fs.mkdir(resumeDir, { recursive: true }).catch(console.error);
fs.mkdir(chatImagesDir, { recursive: true }).catch(console.error);
fs.mkdir(blogImagesDir, { recursive: true }).catch(console.error);
fs.mkdir(groupImagesDir, { recursive: true }).catch(console.error);
fs.mkdir(threadsDir, { recursive: true }).catch(console.error);
fs.mkdir(storiesDir, { recursive: true }).catch(console.error);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const fieldToDir = {
            'resume': resumeDir,
            'chat_image': chatImagesDir,
            'blog_image': blogImagesDir,
            'group_logo': groupImagesDir,
            'group_background': groupImagesDir,
            'thread_media': threadsDir,
            'story_media': storiesDir
        };
        const dir = fieldToDir[file.fieldname] || uploadDir;
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        // Securely get user identifier, default to 'guest' if not logged in
        const userIdentifier = (req.user && req.user.userId) ? req.user.userId : 'guest';
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${file.fieldname}-${userIdentifier}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage: storage });

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
const blogRoutes = require('./api/blogs')(pool, upload);
const campaignRoutes = require('./api/campaigns')(pool);
const eventRoutes = require('./api/events')(pool, createGlobalNotification);
const jobRoutes = require('./api/jobs')(pool, upload, createGlobalNotification);
const mentorRoutes = require('./api/mentors')(pool);
const messageRoutes = require('./api/messages')(pool, upload);
const notificationRoutes = require('./api/notifications')(pool);
const userRoutes = require('./api/users')(pool, upload);
const groupRoutes = require('./api/groups')(pool, upload);
const threadRoutes = require('./api/threads')(pool, upload);
const storyRoutes = require('./api/stories')(pool, upload);
const socialRoutes = require('./api/social')(pool);

// Apply verifyToken middleware to all routes that require authentication
app.use('/api/admin', verifyToken, adminRoutes);
app.use('/api/blogs', verifyToken, blogRoutes);
app.use('/api/campaigns', verifyToken, campaignRoutes);
app.use('/api/events', verifyToken, eventRoutes);
app.use('/api/jobs', verifyToken, jobRoutes);
app.use('/api/mentors', verifyToken, mentorRoutes);
app.use('/api/messages', verifyToken, messageRoutes);
app.use('/api/notifications', verifyToken, notificationRoutes);
app.use('/api/users', userRoutes); // User creation and login don't need a token
app.use('/api/groups', verifyToken, groupRoutes);
app.use('/api/threads', threadRoutes); // Some thread endpoints are public (viewing)
app.use('/api/stories', storyRoutes); // Some story endpoints are public (viewing)
app.use('/api/social', socialRoutes); // Social features (follow, profile stats, highlights)


// --- CENTRAL ERROR HANDLING MIDDLEWARE ---
app.use((err, req, res, next) => {
    console.error(err.stack);
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

    socket.on("sendMessage", async ({ senderId, senderName, receiverId, content, conversationId, messageType }) => {
        const user = getUser(receiverId);
        if (user) {
            io.to(user.socketId).emit("getMessage", {
                sender_id: senderId,
                content,
                created_at: new Date().toISOString(),
                conversation_id: conversationId,
                message_type: messageType,
            });

            io.to(user.socketId).emit("getNotification", {
                senderName: senderName,
                message: messageType === 'text' ? content : 'Sent an image',
            });
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