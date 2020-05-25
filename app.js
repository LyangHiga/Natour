const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const comprassion = require('compression');

const appError = require('./utils/appError');
const errorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Golbal MIDDLEWARES

// Set security HTTP headers
app.use(helmet());

// dev logging
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// limit requests
const limiter = rateLimit({
  // max 100 req per hour (in ms)
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests',
});

app.use('/api', limiter);

// middleware to get access to req body => body parser
// data larger than 10kn wont be accepted
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data Sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data Sanitization against XSS
app.use(xss());

app.use(comprassion());

// prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

// serving static files
app.use(express.static(path.join(__dirname, 'public')));

// ROUTES
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/booking', bookingRouter);

// order matter => this must to be the last one!
app.all('*', function (req, res, next) {
  next(new appError(`Cant find ${req.originalUrl}`, 404));
});

// with an error is throw this error handler middleware is called
app.use(errorHandler);

module.exports = app;
