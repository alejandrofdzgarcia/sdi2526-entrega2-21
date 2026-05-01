var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var crypto = require('crypto');

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

app.use(session({
    secret: 'sdi2526-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60 * 60 * 1000 }
}));

app.get('/test/reset', async function (req, res) {
    try {
        // Ejecutar el mismo código que tu seed.js
        await resetDatabase(db);
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.set('crypto', crypto);
app.set('clave', 'abcdefg');

app.use(function (req, res, next) {
    res.locals.sessionUser = req.session.user || null;
    res.locals.sessionNombre = req.session.nombre || null;
    res.locals.sessionRole = req.session.role || null;
    next();
});

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "POST, GET, DELETE, UPDATE, PUT");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, token");

    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

const { MongoClient } = require("mongodb");
const url = "mongodb://localhost:27017";
const dbClient = new MongoClient(url);

const usersRepository = require('./repositories/usersRepository');
const spacesRepository = require('./repositories/spacesRepository');
const reservationsRepository = require('./repositories/reservationsRepository');
const maintenanceRepository = require('./repositories/maintenanceRepository');

usersRepository.init(app, dbClient);
spacesRepository.init(app, dbClient);
reservationsRepository.init(app, dbClient);
maintenanceRepository.init(app, dbClient);

const adminSessionRouter = require('./routes/adminSessionRouter');
const userSessionRouter = require('./routes/userSessionRouter');
const userTokenRouter = require('./routes/userTokenRouter');

app.use('/admin', adminSessionRouter);
app.use('/spaces', userSessionRouter);
app.use('/users/change-password', userSessionRouter);
app.use('/api/v1.0/reservations', userTokenRouter);
app.use('/', indexRouter);


require('./routes/users')(app, usersRepository);
require('./routes/spaces')(app, spacesRepository, maintenanceRepository, reservationsRepository, usersRepository);
require('./routes/reservations')(app, reservationsRepository, spacesRepository, usersRepository);

require('./routes/api/usersAPIv1.0')(app, usersRepository);
require('./routes/api/reservationAPIv1.0')(app, spacesRepository, reservationsRepository, maintenanceRepository);
require('./routes/api/spacesAPIv1.0')(app, spacesRepository);

app.use(function (req, res, next) {
    next(createError(404));
});

app.use(function (err, req, res, next) {
    res.locals.message = err.message;
    res.locals.error = app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;