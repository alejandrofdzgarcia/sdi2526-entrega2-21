const express = require('express');
const adminSessionRouter = express.Router();

adminSessionRouter.use(function (req, res, next) {
    if (!req.session || !req.session.user) {
        return res.redirect('/users/login');
    }

    if (req.session.role !== 'Administrador') {
        return res.status(403).render('error.twig', {
            message: 'Acceso denegado. No tienes permisos para acceder a este recurso.',
            messageType: 'alert-danger'
        });
    }

    next();
});

module.exports = adminSessionRouter;