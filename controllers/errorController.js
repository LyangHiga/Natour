const Apperror = require('../utils/appError');

const handleJWTExpiredError = () =>
  new Apperror('Token expired. Log in again', 401);

const handleJWTTokenError = () =>
  new Apperror('Invalid Token. Log in again', 401);

const handleValidationErrorDb = (err) => {
  const errors = Object.values(err.errors).map((e) => e.message);
  const message = `Invalid input data.${errors.join('. ')}`;
  return new Apperror(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate fields value: ${value}. Try another val`;
  return new Apperror(message, 400);
};

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new Apperror(message, 400);
};

const sendErrorDev = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
  console.error('ERROR: ', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    msg: err.message,
  });
};

const sendErrorProd = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    // Operational, trustred error: send message!
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    //   Programming or other unknow error: dont send details to client!
    // log error!!!!
    console.error('ERROR: ', err);
    // send response to the client
    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong',
    });
  }
  // Operational, trustred error: send message!
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong',
      msg: err.message,
    });
  }
  //   Programming or other unknow error: dont send details to client!
  // log error!!!!
  console.error('ERROR: ', err);
  // send response to the client
  res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    msg: 'error, try later',
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDb(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTTokenError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    sendErrorProd(error, req, res);
  }

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
};
