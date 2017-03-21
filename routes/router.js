const express = require('express');
const validator = require('validator');
const shortid = require('shortid');
const URL = require('url');
const router = express.Router();
const mysql = require('mysql');

// Connect to database
const db = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DB
});

// Checks if an object is empty
const isEmpty = function(obj) {
   if(typeof obj !== 'object') {
     return true;
   } else {
     let size = 0;
     for(let key in obj) {
       if(obj.hasOwnProperty(key)) {
         size++;
       }
     }
     if(size > 0) {
       return false;
     }
     return true;
   }
}

router.get('/', function(req, res, next) {
  // Check querystring
  if(isEmpty(req.query) || !req.query.hasOwnProperty('url')) {
    // querstring is empty or do not contains url
    next();
  } else {
    let url = req.query.url;
    let validationOption = { require_protocol:true };
    let port = (router.get('env') === 'production') ? '' : 3000;
    // Check if querystring url is a valid url
    if(validator.isURL(url, validationOption)) {
      // Connect to database
      db.getConnection(function(err, connection) {
        // Look for the query url in the database
        connection.query(`SELECT shortUrl, url FROM Urls WHERE url='${url}'`, function(err, results, fields) {
          // Internal error handler
          if(err) {
            return res.status(500).json({
              status: 500,
              error: 'Unexpected error'
            });
          } else {
            // Prepare to get db query result
            let result = {};
            if(results.length !== 0) {
              // database already contains the query url
              result = {
                url: results[0].url,
                short_url: results[0].shortUrl,
                status: 200
              }
              connection.release();
              // Return the short url
              return res.status(200).json(result);
            } else {
              // Data base does not contain the query url
              // Prepare to insert the query url
              let id = shortid.generate();
              let shortUrl = `${req.protocol}://${req.hostname}:${port}/${id}`;
              // Insert the new url
              connection.query(`INSERT INTO Urls (id, shortUrl, url) VALUES ('${id}', '${shortUrl}', '${url}')`, function(err, results, fields) {
                // Internal error handler
                if(err) {
                  return res.status(500).json({
                    status: 500,
                    error: 'Unexpected error'
                  });
                } else {
                  connection.release();
                  // Send the short url
                  return res.status(200).json({
                    url: url,
                    short_url: shortUrl,
                    status: 200
                  });
                }
              });
            }
          }
        });
      });
    } else {
      // Invalid query url
      return res.status(400).json({
        status: 400,
        error: 'not a valid url'
      });
    }
  }
}, function(req, res, next) {
  // No query string or wrong query 
  return res.status(200).render('index');
});

// Short url redirection path
router.get(/^\/[\w-]{7,14}$/, function(req, res, next) {
  let path = req.path.replace('/', '');
  // Connect to database
  db.getConnection(function(err, connection) {
    // Internal error handler
    if(err) {
      return res.status(500).render('500');
    } else {
      // Look for the short url 
      connection.query(`SELECT url FROM Urls Where id='${path}'`, function(err, results, fields) {
        // Internal error handler
        if(err) {
          return res.status(500).render('500');
        } else {
          // Found the short url
          if(results.length !== 0) {
            let url = results[0].url;
            connection.release();
            // Redirect to the original url
            return res.redirect(url);
          } else {
            // Redirect to home page
            connection.release();
            return res.redirect('/');
          }
        }
      });
    }
  });
});

// Wrong params, redirect to home page
router.use(function(req, res, next) {
  res.redirect('/');
});

module.exports = router;