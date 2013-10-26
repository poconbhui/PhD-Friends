"use strict"

var quickGet = require(__dirname + '/../helpers/quickGet');
var People = require(__dirname + '/../models/people');


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
var PeopleController = function() {

    // Send JSON array containing a list of ids for all research students
    // in geoscience
    this.index = function(req, res) {
        People.all(function(ids) {
            res.send(ids);
        });
    };



    // Send a json object containing a url to the person's face and
    // their name
    this.show = function(req, res) {
        People.find(req.params.id, function(person) {
            res.send(person);
        });
    };

};


module.exports = new PeopleController();
