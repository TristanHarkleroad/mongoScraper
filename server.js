const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const request = require('request');
const cheerio = require('cheerio');

//db connection
const db = require('./models');

//PORT connection
const PORT = process.env.PORT || 3000;

//Express initialization
const app = express();

app.use(bodyParser.urlencoded({ extended: true}));

//Handlebars config
const exphbs = require('express-handlebars');
app.engine(
  "handlebars",
  exphbs({
    defaultLayout: 'main'
  })
);
app.set(
  'view engine',
  'handlebars'
);
app.use(express.static('public'));

const router = require('./controllers/api.js');
app.use(router);

//MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost/mongoHeadlines';

//ES6 promises 
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI);

//Listener
app.listen(PORT, function() {
  console.log(`App running on port: ${PORT}`
)});

