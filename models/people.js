"use strict"

var quickGet = require(__dirname + '/../helpers/quickGet');


var People = function() {

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


    // Return array containing ids for everyone in geoscience
    this.all = function(cb) {

        if(peopleCache.length == 0) {
            // Generate request to geophysics
            var params = { cw_xml: 'students.html' };
            quickGet(people_url, params, function(str,err) {
                peopleCache = peoplePageToArr(str);

                cb(peopleCache, null);
            });
        }
        else {
            cb(peopleCache, null);
        }
    };



    // Return an object containing a url to the person's face and
    // their name
    this.find = function(id, cb) {
        if(!individualCache[id]) {
            // Generate request to geophysics
            var params = { cw_xml: 'student.html', indv: id };
            quickGet(people_url, params, function(str,err) {
                individualCache[id] = individualPageToObj(str);

                cb(individualCache[id], null);
            });
        }
        else {
            cb(individualCache[id], null);
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


module.exports = new People();
