const jwt = require('jsonwebtoken');
const express = require('express');
const userTokenRouter = express.Router();
const JWT_SECRET = 'secreto';

userTokenRouter.use(function (req, res, next) {
    console.log('[userTokenRouter] verificando token para:', req.originalUrl);

    const token = req.headers['token'] || req.body.token || req.query.token;

    if (!token) {
        return res.status(403).json({
            authorized: false,
            error: 'No hay Token'
        });
    }

    jwt.verify(token, JWT_SECRET, {}, function (err, infoToken) {
        if (err) {
            return res.status(403).json({
                authorized: false,
                error: 'Token inválido o caducado'
            });
        }

        if ((Date.now() / 1000 - infoToken.time) > 24000) {
            return res.status(403).json({
                authorized: false,
                error: 'Token caducado'
            });
        }

        res.user = infoToken.user;
        req.session.user = infoToken.user;
        req.session.role = infoToken.role || 'standard';
        next();
    });
});

module.exports = userTokenRouter;