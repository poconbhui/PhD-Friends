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
// Send list of people as JSON
var peopleCache = [];
app.get('/people', function(req, res) {

    // Generate request to geophysics
    var people = 'http://www.ed.ac.uk/schools-departments/geosciences/people'
    var params = { cw_xml: 'students.html' };

    if(peopleCache.length == 0) {
        quickGet(people, params, function(str,err) {
            peopleCache = peoplePageToArr(str);

            res.send(peopleCache);
        });
    }
    else {
        res.send(peopleCache);
    }
});


function peoplePageToArr(data) {

    // Get links between title Full-Time... and M.Sc.
    // Effectively, only PhD students
    data = data.match(
        /Full-Time Research Students.*M.Sc. Carbon Capture and Storage/
    )[0];

    // Match all person links in selected section
    var matches = data.match(
        /<a href=[^>]*indv=\d*&cw_xml=student.html">[^<]*<\/a>/g
    );

    // Parse the links into a format {indv, name}
    for(var i in matches) {
        data = matches[i].match(/indv=(\d*)&.*>(.*)</);

        matches[i] = {
            indv: data[1],
            name: data[2]
        };
    }

    return matches
}


// Proxy geosciences individual pages via /people/:id
var individualCache = {};
app.get('/people/:id', function(req, res) {
    console.log(req.params);

    // Generate request to geophysics
    var people = 'http://www.ed.ac.uk/schools-departments/geosciences/people'
    var params = { cw_xml: 'student.html', indv: req.params.id };

    if(!individualCache[req.params.id]) {
        quickGet(people, params, function(str,err) {
            individualCache[req.params.id] = individualPageToObj(str);

            res.send(individualCache[req.params.id]);
        });
    }
    else {
        res.send(individualCache[req.params.id]);
    }
});


function individualPageToObj(data) {
    var individual = {};

    individual.face = (function() {
        var matches = data.match(/src="([^"]*\/faces\/[^"]*)"/);

        if(matches) return matches[1];
        else        return 'None';
    })();

    individual.name = (function() {
        var matches = data.match(/<div id="geosPeople"> *<h3>([^<]*)<\/h3>/);

        if(matches) return matches[1];
        else        return 'None';
    })();

    return individual;
}




// Connect to port
app.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
