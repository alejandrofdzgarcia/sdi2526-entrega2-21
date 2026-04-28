var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'twig');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const { MongoClient } = require("mongodb");
const url = "mongodb://localhost:27017";
const dbClient = new MongoClient(url);

const spacesRepository = require('./repositories/spacesRepository');
const reservationsRepository = require('./repositories/reservationsRepository');
const maintenanceRepository = require('./repositories/maintenanceRepository');

spacesRepository.init(app, dbClient);
reservationsRepository.init(app, dbClient);
maintenanceRepository.init(app, dbClient);

require('./routes/spaces')(app, spacesRepository);
require('./routes/api/reservationAPIv1.0')(app, spacesRepository, reservationsRepository, maintenanceRepository);
require("./routes/reservations.js")(app, reservationsRepository, spacesRepository);
app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
