"use strict"

var express = require('express');
var http = require('http');
var ejs = require('ejs');

var app = express();


// Set up express
app.configure(function() {
    app.set('port', process.env.PORT || 3000);

    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
    app.engine('.html', ejs.__express);

    app.use('/assets', express.static(__dirname + '/assets'));
});



// Serve index
app.get('/', function(req, res) {
    //res.send("Go suck a brick");
    res.render('index.html');
});


// Given an object, return a GET friendly string
function objectToGet(obj) {
    var ret = '';

    for(var i in obj) {
        ret += i + '=' + obj[i] + '&';
    }

    ret = ret.slice(0, -1);

    return ret;
}


// Proxy geosciences people page via /people
app.get('/people', function(req, res) {

    // Generate request to geophysics
    var people = 'http://www.ed.ac.uk/schools-departments/geosciences/people'
    people += '?' + objectToGet(req.query);

    http.get(people, function(people_res) {

        var str = '';

        //another chunk of data has been recieved, so append it to `str`
        people_res.on('data', function (chunk) {
            str += chunk;
        });

        //the whole response has been recieved, so we just print it out here
        people_res.on('end', function () {
            res.send(str);
        });
    });
});


// Connect to port
app.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
