"use strict"

var quickGet = require(__dirname + '/../helpers/quickGet');


// This object provides routing for /people.
//
// This acts as a proxy and processor for the geosciences people pages
// for phd students.
//
// The method people.index sends a JSON array containing the ids of
// all the research students in the geoscience department
//
// The method people.show expects the url to be of the form /people/:id
// and returns a JSON object containing a url for a picture of that person
// and the person's name
//
var people = function() {

    var people_url =
        'http://www.ed.ac.uk/schools-departments/geosciences/people';

    // Cache for processed geosciences people page
    // Contains list of individual ids
    var peopleCache = [];

    // Cache for processed geosciences individual page
    // Contains objects of the form
    //   individualCache[id] = {face:'/url/to/face.jpg', name: 'My Name'}
    var individualCache = {};



    /////////////////////
    // Routing methods //
    /////////////////////


    // Send JSON array containing a list of ids for all research students
    // in geoscience
    this.index = function(req, res) {

        // Generate request to geophysics
        var people = people_url;
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
    };



    // Send a json object containing a url to the person's face and
    // their name
    this.show = function(req, res) {
        // Generate request to geophysics
        var people = people_url;
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
    };




    ///////////////////////////////////////
    // Scraped page processing functions //
    ///////////////////////////////////////


    // Parse the scraped people page to an array of indv ids.
    // return: [id1, id2, id3, ...]
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
            data = matches[i].match(/indv=(\d*)&/);

            matches[i] = data[1];
        }

        return matches
    }


    // Parse an individual's page to an object containing a url to their
    // picture and their full name.
    // return: {face: 'url/to/face.jpg', name: 'My Name'}
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

};


module.exports = new people();
