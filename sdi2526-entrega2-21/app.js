var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var crypto = require('crypto');

var indexRouter = require('./routes/index');

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const { User } = require('./schemas/user');
const { Space } = require('./schemas/space');
const { Reservation, ReservationRequest, RecurrenceRequest } = require('./schemas/reservation');
const { LoginRequest, SignupRequest } = require('./schemas/auth');

const { MongoClient } = require("mongodb");
const url = "mongodb://localhost:27017";
const dbClient = new MongoClient(url);
const db = dbClient.db("spaceReservationManagement");

var app = express();

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API de Gestión de Reservas de Espacios',
            version: '1.0.0',
            description: 'Documentación interactiva de la API para la gestión de usuarios, espacios y reservas.',
        },
        components: {
            securitySchemes: {
                tokenAuth: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'token',
                    description: 'Token JWT para autenticación en la API'
                }
            },
            schemas: {
                User,
                Space,
                Reservation,
                ReservationRequest,
                RecurrenceRequest,
                LoginRequest,
                SignupRequest
            }
        },
        servers: [
            {
                url: 'http://localhost:8081',
                description: 'Servidor de pruebas de la aplicación',
            },
        ],
    },
    apis: [
        path.join(__dirname, '/routes/api/*.js')
    ],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'twig');

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

const dbInit = require('./public/javascripts/dbInit');

app.get('/test/reset', async function (req, res) {
    try {
        await dbInit.resetDatabase(db);
        res.json({ ok: true });
    } catch (e) {
        console.error("Reset error:", e);
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