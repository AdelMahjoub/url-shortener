const express = require('express');
const path = require('path');
const routes = require('./routes/router.js');
const compression = require('compression');
const minify = require('express-minify');
const helmet = require('helmet');

const app = express();

// Disable server signature
app.disable('x-powered-by');

// Helmet middleware on production env
if(app.get("env") === "production") {
  app.enable("trust-proxy");
  app.use(helmet.xssFilter());
  app.use(helmet.noSniff());
  app.use(helmet.frameguard({
    action: "deny"
  }));
}

// Compression and minifying Middlewares
app.use(compression());
app.use(minify({cache: path.join(__dirname, "cache")}));

// Set port
app.set('port', process.env.PORT || 3000);

// Set views
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes Middleware
app.use(routes);

// Start server
app.listen(app.get('port'), function() {
  console.log(`Server running at port ${app.get('port')}`);
});
