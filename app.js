try {
  require('dotenv').config();
} catch (e) {
  console.warn('dotenv not installed, using hardcoded connection');
}
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
let mongoose = require('mongoose')

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var messagesRouter = require('./routes/messages');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/messages', messagesRouter);
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/products', require('./routes/products'))
app.use('/api/v1/categories', require('./routes/categories'))
app.use('/api/v1/roles', require('./routes/roles'))
app.use('/api/v1/upload', require('./routes/upload'))
// Kết nối MongoDB Atlas
const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://notmytuan_db_user:nhat29112004@cluster0.xbbppwr.mongodb.net/NNPTUD-C5?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(mongoURI, {
  serverSelectionTimeoutMS: 15000,
  family: 4
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('connected', function () {
  console.log("connected");
})
mongoose.connection.on('disconnecting', function () {
  console.log("disconnected");
})

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
  res.send(err.message);
});

module.exports = app;
