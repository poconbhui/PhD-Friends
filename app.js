"use strict"

var express = require('express');
var http = require('http');
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
    //res.send("Go suck a brick");
    res.render('index.html');
});



//
// Some nice http getting functions
//

// Given an object, return a GET friendly string
function objectToGet(obj) {
    var ret = '';

    for(var i in obj) {
        ret += i + '=' + obj[i] + '&';
    }

    ret = ret.slice(0, -1);

    return ret;
}

// Get data from a url with the given params as an object
// and return the string of data in cb(string, err)
function quickGet(url, params, cb) {
    console.log(url + '?' + objectToGet(params));
    http.get(url + '?' + objectToGet(params), function(people_res) {

        var str = '';

        //another chunk of data has been recieved, so append it to `str`
        people_res.on('data', function (chunk) {
            str += chunk;
        });

        //the whole response has been recieved, so we just print it out here
        people_res.on('end', function () {
            cb(str, null);
        });
    });
}


//
// Geosciences proxying routes
//

// Proxy geosciences people page via /people
app.get('/people', function(req, res) {

    // Generate request to geophysics
    var people = 'http://www.ed.ac.uk/schools-departments/geosciences/people'
    var params = { cw_xml: 'students.html' };

    quickGet(people, params, function(str,err) {
        res.send(str);
    });
});


// Proxy geosciences individual pages via /people/:id
app.get('/people/:id', function(req, res) {
    console.log(req.params);

    // Generate request to geophysics
    var people = 'http://www.ed.ac.uk/schools-departments/geosciences/people'
    var params = { cw_xml: 'student.html', indv: req.params.id };

    quickGet(people, params, function(str,err) {
        res.send(str);
    });
});




// Connect to port
app.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
