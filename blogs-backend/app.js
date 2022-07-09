const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('express-async-errors');

const config = require('./utils/config');
const logger = require('./utils/logger');
const middlewares = require('./utils/middlewares');

const blogRouter = require('./controllers/blogs');
const usersRouter = require('./controllers/users');
const loginRouter = require('./controllers/login');

const app = express();

/* Db connection */
logger.info(`connecting to ${config.MONGODB_URI}`);
mongoose
    .connect(config.MONGODB_URI)
    .then(({ connection }) =>
        logger.info(`connected to DB = ${connection.name}`)
    )
    .catch((error) => logger.error(`error on DB connection: ${error.message}`));

/* Middlewares */
app.use(cors());
app.use(express.json());
app.use(middlewares.tokenExtractor);
app.use(middlewares.requestLogger);

/* Routers */
app.use('/api/v1/blogs', blogRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/login', loginRouter);

// This must be the last middleware
app.use(middlewares.errorHandler);

module.exports = app;
