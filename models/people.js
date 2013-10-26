"use strict"

var quickGet = require(__dirname + '/../helpers/quickGet');
var memjs = require('memjs').Client.create();


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
                console.log("Have value");
                var people = eval(value.toString());
                cb(people, null);
            }
            else {
                console.log("Fetching");
                // Generate request to geophysics
                var params = { cw_xml: 'students.html' };
                quickGet(people_url, params, function(str,err) {
                    var people = JSON.stringify(peoplePageToArr(str));

                    memjs.set('people', people);
                    cb(people, peopleCache, null);
                });
            }
        });
    };



    // Return an object containing a url to the person's face and
    // their name
    this.find = function(id, cb) {
        memjs.get('people:'+id, function(err, value, key) {
            if(value) {
                individual = eval(value.toString);
                cb(individual, null);
            }
            else {
                // Generate request to geophysics
                var params = { cw_xml: 'student.html', indv: id };
                quickGet(people_url, params, function(str,err) {
                    var individual = individualPageToObj(str);

                    memjs.set('people:'+id, individual);
                    cb(individual, null);
                });
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
