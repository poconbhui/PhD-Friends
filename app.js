"use strict"

var express = require('express');
var ejs = require('ejs');

var app = express();


// Set up express
app.configure(function() {
    app.set('port', process.env.PORT || 5000);

    // Add gzipping while sending data
    app.use(express.compress());

    // Serve .html files
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
    app.engine('.html', ejs.__express);

    // Serve static files from /assets
    var one_year = 31557600000;
    app.use(
        '/assets',
        express.static(__dirname + '/assets', {maxAge: one_year})
    );
});



// Serve index
app.get('/', function(req, res) {
    res.render('index.html');
});



// Serve people pages
var people = require(__dirname + '/people');

app.get('/people', people.index);
app.get('/people/:id', people.show);




// Connect to port
app.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
