// Dosya Adı: server.js
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: { origin: "*" }
});
const path = require('path');

const PORT = process.env.PORT || 3000;

// public klasöründeki HTML ve JS dosyalarını dışarıya açıyoruz
app.use(express.static(path.join(__dirname, 'public')));

// Odaları ve kullanıcıları tutmak için basit bir obje
const rooms = {};

io.on('connection', (socket) => {
    console.log('Bir kullanıcı bağlandı:', socket.id);

    // Kullanıcı bir odaya katılmak istediğinde
    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        
        // Odada halihazırda başka biri varsa onu yeni gelene bildiriyoruz (WebRTC Sinyalleşmesi)
        socket.to(roomId).emit('user-connected', socket.id);

        socket.on('disconnect', () => {
            socket.to(roomId).emit('user-disconnected', socket.id);
            console.log('Kullanıcı ayrıldı:', socket.id);
        });

        // WebRTC teklif ve cevaplarını (SDP) diğer kullanıcıya aktarma basamağı
        socket.on('signal', (data) => {
            io.to(data.to).emit('signal', {
                from: socket.id,
                signal: data.signal
            });
        });
    });
});

http.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor...`);
});
