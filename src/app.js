// @flow

const express = require('express');
const bodyParser = require('body-parser');
const middlewares = require('./middlewares');
const routes = require('./routes');

// Set up the express app
const app: express$Application = express();

// use body parser to easy fetch post body
// https://stackoverflow.com/questions/45601261/take-html-form-and-pass-values-to-variables-in-node-js-function
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())

app.use('/pnj/', routes.conf);

app.use(middlewares.errors);

module.exports = app;