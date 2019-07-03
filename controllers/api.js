const express = require('express');
const router = express.Router();
const db = require('../models');
const request = require('request');
const cheerio = require('cheerio');


// //GET the information
router.get("/scrape", (req, res) => {
  console.log("scrape commenced")
  // First, we grab the body of the html with request
  request("https://news.ycombinator.com/", (error, response, body) => {
      if (!error && response.statusCode === 200) {
          // Then, we load that into cheerio and save it to $ for a shorthand selector
          const $ = cheerio.load(body);
          let count = 0;
          console.log('200 code')
          // Now, we grab every article:
          $('.title').each(function (i, element) {
            console.table(i)
            console.log('logged elements')
              // Save an empty result object
              let count = i;
              let result = {};
              // Add the text and href of every link, and summary and byline, saving them to object
                result.title = $(element)
                    .children('a')
                    .text();
                result.link = $(element)
                    .children('a')
                    .attr("href");
                result.byline = $(element)
                    .children('.byline')
                    .text().trim()
                    || 'No byline available'
              console.table(result)
              if (result.title && result.link){
                  // Create a new Article using the `result` object built from scraping, but only if both values are present
                  db.Article.create(result)
                      .then(function (dbArticle) {
                          // View the added result in the console
                          count++;
                          
                      })
                      .catch(function (err) {
                          // If an error occurred, send it to the client
                          return res.json(err);
                      });
              };
          });
          // If we were able to successfully scrape and save an Article, redirect to index
          res.redirect('/')
          console.log('redirected')
      }
      else if (error || response.statusCode != 200){
          res.send("Error: Unable to obtain new articles")
      }
  });
});


router.get('/', (req, res) => {
    db.Article.find({})
      .then(function (dbArticle) {
        const retrievedArticles = dbArticle;
        let hbsObject;
        hbsObject = {
          articles: retrievedArticles
        };
        res.render('index', hbsObject);
      })
      .catch(function (err) {
        res.json(err);
      });
});

router.get('/saved', (req, res) => {
  db.Article.find({isSaved: true})
    .then(function (retrievedArticles) {
      let hbsObject;
      hbsObject = {
        articles: retrievedArticles
      };
      res.render('saved', hbsObject);
    })
    .catch(function (err) {
      res.json(err);
    });
});

router.get('/articles', function (req, res) {
  db.Article.find({})
    .then(function (dbArticle) {
      res.json(dbArticle);
    })
    .catch(function (err) {
      res.json(err);
    });
});

router.put('/save/:id', function (req, res) {
  db.Article.findOneAndUpdate({_id: req.params.id }, { isSaved: true })
    .then(function (data) {
      res.json(data);
    })
    .catch(function (err) {
      res.json(err);
    });
});

router.put('/remove/:id', function (req, res) {
  db.Article.findOneAndUpdate({_id: req.params.id }, { isSaved: false })
    .then(function (data) {
      res.json(data);
    })
    .catch(function (err) {
      res.json(err);
    });
});

router.get('/articles/:id', function (req, res) {
  db.Article.find({_id: req.params.id })
    .populate({
      path: 'note',
      model: 'Note'
    })
    .then(function (dbArticle) {
      res.json(dbArticle);
    })
    .catch(function (err) {
      res.json(err);
    });
});

router.post('/note/:id', function (req, res) {
  db.Note.create(req.body)
    .then(function (dbNote) {
      return db.Article.findOneAndUpdate({
        _id: req.params.id
       }, 
       {
         $push: {
           note: dbNote._id
          }}, 
        {
          new: true
        });
    })
    .then(function (dbArticle) {
      res.json(dbArticle);
    })
    .catch(function (err) {
      res.json(err);
    });
});

router.delete('/note/:id', function (req, res) {
  db.Note.findByIdAndRemove({_id: req.params.id})
  .then(function (dbNote) {
    return db.Article.findOneAndUpdate({
      _id: req.params.id
    }, 
    {
      $pullAll: [{
        note: dbNote._id
    }]});
  })
  .then(function (dbArticle) {
    res.json(dbArticle);
  })
  .catch(function (err) {
    res.json(err);
  });
});

module.exports = router;
