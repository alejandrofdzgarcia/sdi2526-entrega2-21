var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');

var indexRouter = require('./routes/index');

var app = express();

// ─── View engine ────────────────────────────────────────────────────────────
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'twig');

// ─── Middleware básico ───────────────────────────────────────────────────────
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// ─── Sesiones ────────────────────────────────────────────────────────────────
app.use(session({
    secret: 'sdi2526-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60 * 60 * 1000 } // 1 hora
}));

// TEMPORAL: simular sesión para desarrollo
app.use(function (req, res, next) {
    if (!req.session.user) {
        req.session.user = {
            dni: "12345678Z",
            name: "Admin",
            role: "Administrador"
        };
    }
    next();
});

// ─── CORS ────────────────────────────────────────────────────────────────────
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "POST, GET, DELETE, UPDATE, PUT");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, token");

    if ('OPTIONS' === req.method) {
        res.sendStatus(200);
    } else {
        next();
    }
});

// ─── MongoDB ─────────────────────────────────────────────────────────────────
const { MongoClient } = require("mongodb");
const url = "mongodb://localhost:27017";
const dbClient = new MongoClient(url);

// ─── Repositorios ─────────────────────────────────────────────────────────────
const spacesRepository = require('./repositories/spacesRepository');
const reservationsRepository = require('./repositories/reservationsRepository');
const maintenanceRepository = require('./repositories/maintenanceRepository');
const usersRepository = require('./repositories/usersRepository');

spacesRepository.init(app, dbClient);
reservationsRepository.init(app, dbClient);
maintenanceRepository.init(app, dbClient);
usersRepository.init(app, dbClient);

// ─── Rutas ────────────────────────────────────────────────────────────────────
require('./routes/spaces')(app, spacesRepository, maintenanceRepository, reservationsRepository, usersRepository);
require('./routes/api/reservationAPIv1.0')(app, spacesRepository, reservationsRepository, maintenanceRepository);
require('./routes/api/spacesAPIv1.0')(app, spacesRepository);
require('./routes/reservations.js')(app, reservationsRepository, spacesRepository);
app.use('/', indexRouter);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use(function (req, res, next) {
    next(createError(404));
});

// ─── Error handler ────────────────────────────────────────────────────────────
app.use(function (err, req, res, next) {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;