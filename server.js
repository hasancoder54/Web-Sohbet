// Dosya Adı: server.js
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { cors: { origin: "*" } });
const path = require('path');

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

// Aktif kullanıcıları ve cihaz bilgilerini tutan obje
const activeUsers = {};

io.on('connection', (socket) => {
    // Rastgele bir cihaz/kullanıcı ismi atıyoruz
    const deviceName = "Cihaz-" + socket.id.substring(0, 5).toUpperCase();
    activeUsers[socket.id] = { id: socket.id, name: deviceName };

    console.log(`${deviceName} bağlandı.`);

    // Her yeni bağlantıda güncel kullanıcı listesini herkese gönder
    io.emit('user-list-update', Object.values(activeUsers));

    // Sesli/Görüntülü odaya katılma isteği
    socket.on('join-room', () => {
        socket.broadcast.emit('user-joined-room', socket.id);
    });

    // WebRTC Sinyal verilerinin (Offer, Answer, ICE) hedef cihaza iletilmesi
    socket.on('signal', (data) => {
        io.to(data.to).emit('signal', {
            from: socket.id,
            signal: data.signal
        });
    });

    // Kullanıcı konuşma durumunu değiştirdiğinde arayüz simgesi için yayınla
    socket.on('speaking-state', (isSpeaking) => {
        socket.broadcast.emit('user-speaking-state', { id: socket.id, isSpeaking });
    });

    socket.on('disconnect', () => {
        console.log(`${activeUsers[socket.id]?.name} ayrıldı.`);
        delete activeUsers[socket.id];
        // Ayrılan kişiyi listeden düşmek için güncel listeyi fırlat
        io.emit('user-list-update', Object.values(activeUsers));
        io.emit('user-left-room', socket.id);
    });
});

http.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda aktif.`);
});
