"use strict"

var express = require('express');
var app = express();


// Definition of one year for caching
var one_year = 31557600000;


// Set up express
app.configure(function() {
    app.set('port', process.env.PORT || 5000);

    // Add gzipping while sending data
    app.use(express.compress());

    // Serve static files from /assets
    app.use(
        '/assets',
        express.static(__dirname + '/assets', {maxAge: one_year})
    );
});



// Serve index
app.get('/', function(req, res) {
    res.sendfile(__dirname + '/views/index.html', {maxAge: one_year});
});



// Serve people pages
var people = require(__dirname + '/people');

app.get('/people', people.index);
app.get('/people/:id', people.show);




// Connect to port
app.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
