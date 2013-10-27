"use strict"

var memjs = require('memjs').Client.create();
var request = require('request');


var People = function() {

    var people_url =
        'http://www.ed.ac.uk/schools-departments/geosciences/people';


    /////////////////////
    // Routing methods //
    /////////////////////


    // Return array containing ids for everyone in geoscience
    this.all = function(cb) {
        memjs.get('people', function(err, value, key) {
            if(value) {
                var people = JSON.parse(value.toString());

                cb(people, null);
            }
            else {
                // Generate request to geophysics postgrad students page
                var params = { cw_xml: 'students.html' };
                request(
                    { url: people_url, qs: params },
                    function(err, headers, body) {
                        // Extract data from page
                        var people = peoplePageToArr(body);

                        memjs.set('people', JSON.stringify(people));
                        cb(people, null);
                    }
                );
            }
        });
    };



    // Return an object containing a url to the person's face and
    // their name
    this.find = function(id, cb) {
        memjs.get('people:'+id, function(err, value, key) {
            if(value) {
                var individual = JSON.parse(value.toString());
                cb(individual, null);
            }
            else {
                // Generate request to geophysics individual page
                var params = { cw_xml: 'student.html', indv: id };
                request(
                    { url: people_url, qs: params},
                    function(err, headers, body) {
                        // Extract data from page
                        var individual = individualPageToObj(body);

                        memjs.set('people:'+id, JSON.stringify(individual));
                        cb(individual, null);
                    }
                );
            }
        });
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
