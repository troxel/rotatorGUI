var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

//const db  = require('./services/mysql')

const indexRouter = require('./routes/route_index');
const plotRouter  = require('./routes/route_plot');
const statusRouter  = require('./routes/route_status');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')

// Static resources
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.static(__dirname + '/node_modules/bootstrap/dist'))
app.use(express.static(__dirname + '/node_modules/bootstrap-select/dist'))
app.use(express.static(__dirname + '/node_modules/jquery/dist'))
app.use(express.static(__dirname + '/node_modules/plotly.js-dist-min'))

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())

app.use('/', indexRouter)
app.use('/plot', plotRouter)
app.use('/status', statusRouter)

// custom settings... 
app.locals.pretty = true

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500)
  res.render('error')
});

module.exports = app