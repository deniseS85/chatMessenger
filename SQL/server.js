const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const http = require('http');
const { Server } = require('socket.io');
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const loginRoute = require('./routes/login');
const signupRoute = require('./routes/signup');
const forgotRoute = require('./routes/forgot');
const resetRoute = require('./routes/reset');
const logoutRoute = require('./routes/logout');
const userRoute = require('./routes/users'); 
const editUser = require('./routes/editUser');
const addContact = require('./routes/addContact');
const checkFriendRequest = require('./routes/checkFriendRequest');
const deleteOldRejectedRequests = require('./routes/cleanup');
const friendRoute = require('./routes/friends');
const removeFriend = require('./routes/removeFriend');
const sendMessage = require('./routes/sendMessage');
const getMessage = require('./routes/getMessage');

app.use('/login', loginRoute);
app.use('/signup', signupRoute);
app.use('/forgot-password', forgotRoute);
app.use('/reset-password', resetRoute);
app.use('/logout', logoutRoute);
app.use('/users', userRoute);
app.use('/edit-user', editUser);
app.use('/add-contact', addContact);
app.use('/check-friend-request', checkFriendRequest);
app.use('/friends', friendRoute);
app.use('/removeFriend', removeFriend);
app.use('/sendMessage', sendMessage);
app.use('/getMessage', getMessage);

deleteOldRejectedRequests();

const userSocketMap = {};

io.on('connection', (socket) => {
    socket.on('registerUser', (userId) => {
        userSocketMap[userId] = socket.id;
        socket.broadcast.emit('userStatusChanged', { userId, status: 'online' });
    });

    // Listener für Statusänderungen (Login/Logout)
    socket.on('userStatusChanged', (data) => {
        socket.broadcast.emit('userStatusChanged', data);
    });

     // Freundschaftsanfrage senden
    socket.on('sendFriendRequest', (data) => {
        const { recipientId } = data;
        const recipientSocketId = userSocketMap[recipientId];
        
        if (recipientSocketId) {
            io.to(recipientSocketId).emit('friendRequestReceived', data);
        } else {
            console.log(`Keine Verbindung für den Benutzer ${recipientId}`);
        }
    });

    // Freundschaftsanfrage angenommen oder abgelehnt
    socket.on('respondToFriendRequest', (data) => {
        const { responderId, senderId, status } = data;
        const senderSocketId = userSocketMap[responderId];

        if (senderSocketId) {
            io.to(senderSocketId).emit('friendRequestResponse', { responderId, senderId,  status });
        } else {
            console.log(`Keine Verbindung für den Absender ${responderId}`);
        }
    });

    // Freund entfernen
    socket.on('removeFriend', (data) => {
        const { userId, friendId } = data;
        const friendSocketId = userSocketMap[friendId];

        if (friendSocketId) {
            io.to(friendSocketId).emit('friendRemoved', { userId });
        }
    });

    // Empfangene Nachrichten
    socket.on('sendMessage', (data) => {
        const { sender_id, recipient_id, content } = data;
        const recipientSocketId = userSocketMap[recipient_id];

        console.log(`Sende Nachricht an ${recipient_id}, Socket-ID: ${recipientSocketId}`);

        if (recipientSocketId) {
            io.to(recipientSocketId).emit('messageReceived', { sender_id, content });
            console.log(`Nachricht gesendet an ${recipient_id}: ${content}`);
        } 
    });

    socket.on('disconnect', () => {
       /*  const userId = Object.keys(userSocketMap).find(key => userSocketMap[key] === socket.id);
        if (userId) {
            socket.broadcast.emit('userStatusChanged', { userId, status: 'offline' });
            delete userSocketMap[userId];
        } */
    });
});

const PORT = process.env.PORT || 8081;
server.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}`);
});