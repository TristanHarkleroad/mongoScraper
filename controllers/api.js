const express = require('express');
const router = express.Router();
const db = require('../models');
const request = require('request');
const cheerio = require('cheerio');

//GET the information
router.get('/scrape', (req, res) => {
  console.log('scraping commenced');
  //grab body of html
  request('https://www.nytimes.com/', (err, res, body) => {
    if (!error && Response.statusCode === 200) {
      const $ = cheerio.load(body);
      let count = 0;
      //Grab the articles from body
      $('article').each(function (i, element ) {
        let count = i;
        let result = {};
        //add the href and the text to each link, saving them
        result.title = $('element')
          .children('.story-heading')
          .children('a')
          .text().trim();
        result.link = $('element')
          .children('.story-heading')
          .children('a')
          .attr('href');
        result.summary = $('element')
          .children('.summary')
          .text().trim() || $('element')
            .children('ul')
            .text().trim();
        result.byline = $('element')
          .children('.byline')
          .text().trim() || 'no byline available'
        
        if (result.title && result.link && result.summary) {
          db.Article.create(result)
            .then(function (dbArticle) {
              count++;
            })
            .catch(function (err) {
              return res.json(err);
            });
        };
      });
      res.redirect('/');
    }
    else if (error || res.statusCode !=200) {
      res.setEncoding('Error: Unable to obtain new articles.')
    };
  });
});

router.get('/', (req, res) => {
    db.Article.find({})
      .then(function (dbArticle) {
        const retrievedArticles = dbArticle;
        let hbsObject;
        hbsObject = {
          articles: dbArticle
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