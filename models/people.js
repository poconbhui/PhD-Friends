"use strict"

var memjs = require('memjs').Client.create();
var request = require('request');

function ensureFunction(f) {
    if(typeof f == 'function') {
        return f;
    }
    else {
        return function() {};
    }
}


var People = function() {
    var _this = this;

    var people_url =
        'http://www.ed.ac.uk/schools-departments/geosciences/people';


    /////////////////////
    // Routing methods //
    /////////////////////


    // Return array containing ids for everyone in geoscience
    this.all = function(cb) {
        cb = ensureFunction(cb);

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
        cb = ensureFunction(cb);

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
                        individualPageToObj(body, function(individual){
                            individual.id = id;

                            if(!individual.err) {
                                memjs.set(
                                    'people:'+id, JSON.stringify(individual)
                                );
                                cb(individual, null);
                            }
                            else {
                                // If error, remove person from people list
                                _this.all(function(people) {
                                    var index = people.indexOf(id); 
                                    if(index > -1) {
                                        people.splice(index, 1);
                                        memjs.set(
                                            'people', JSON.stringify(people)
                                        );
                                    }
                                });

                                cb(null, {err: individual.err});
                            }
                        });
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
    // return: cb({face: 'url/to/face.jpg', name: 'My Name'})
    // or cb({err: "Error Description"}) on error
    function individualPageToObj(data, cb) {
        cb = ensureFunction(cb);

        var individual = {};

        // Get person's name
        individual.name = (function() {
            var matches =
                data.match(/<div id="geosPeople"> *<h3>([^<]*)<\/h3>/);

            if(matches) return matches[1];
            else        return 'None';
        })();

        // If no name, return an error
        if(individual.name == 'None') {
            cb({err: "No Name"});
            return;
        }

        // Get face url
        individual.face = (function() {
            var matches = data.match(/src="([^"]*\/faces\/[^"]*)"/);

            if(matches) return matches[1];
            else        return 'None';
        })();

        // If no face URL, return an error
        if(individual.face == 'None') {
            cb({err: "No Face"});
            return;
        }

        // If face URL is for dummy image, return an error
        if(individual.face.match('dummy.jpg')) {
            cb({err: "Dummy Face"});
            return;
        }

        // Load the face and base64 encode
        request(
            { url: individual.face, encoding: null },
            function(err, headers, body) {
                // If error, or not 200 status code, return an error
                // Eg, bad request or 404 error
                if(err || headers.statusCode != 200) {
                    individual.err = "" + headers.statusCode + " Face";
                }

                // Base64 encode face image
                var body64 = body.toString('base64');
                individual.face = body64;

                // Finally return the individual
                cb(individual);
            }
        );

    }

};


module.exports = new People();
