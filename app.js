const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const cors = require('cors');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();

app.enable('trust proxy');

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

//1. GLOBAL MIDDLEWARES
// Implement CORS - This will set Access-Control-Allow-Origin: * (allow all)
// If cors needs to be applied to a sepcific route then add it in the ROUTES middleware stack 
// e.g. app.use('/api/v1/tours', cors(), tourRouter);
app.use(cors());
// Setting cors for just a specific url/origin
// We have api.tours.com (backend) and tours.com as front-end
// app.use(cors({
//   origin: 'https://www.tours.com'
// }))

// Set to which http method the app can respond to
app.options('*', cors());
// to a specific route
// app.options('/api/v1/tours/:id', cors());

// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// Set Security HTTP headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'default-src': [
          "'self'",
          'https://api.mapbox.com',
          'https://events.mapbox.com',
          'http://127.0.0.1:3000',
          'ws://127.0.0.1:49531/',
        ],
        'script-src': [
          "'self'",
          'blob:',
          'https://api.mapbox.com',
          'https://cdnjs.cloudflare.com',
          'https://js.stripe.com',
        ],
        'frame-src': ["'self'", 'https://js.stripe.com'],
      },
    },
  })
);

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same IP
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP. Please try again in an hour',
});
app.use('/api', limiter);

// Body parser: Reading data from the body into req.body
app.use(
  express.json({
    limit: '10kb',
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: '10kb',
  })
);

// Parses the cookie data from incoming requests into req.cookies
app.use(cookieParser());

// Data Sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter (query strings in a URL) pollution
// For example, if we use lke this ?sort=duration&sort=price then it will use only the last paramter
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupSize',
      'difficulty',
      'price',
    ], // duration is now added to the exception list
  })
);

app.use(compression());

// Test middleware
app.use((req, res, next) => {
  req.requestedTime = new Date().toISOString();
  // console.log(req.cookies);
  next();
});

// ROUTES
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/booking', bookingRouter);

// Handling unhandled routes.
app.all('*', (req, res, next) => {
  // next if receives an arguments, it's treated as an error.
  next(new AppError(`Unable to find ${req.originalUrl}`, 404));
});

// By specifying four paramters, express knows it's an error handling function.
// This is an error handling middleware function
app.use(globalErrorHandler);

module.exports = app;
