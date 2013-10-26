"use strict";

var http = require('http');

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
    }).on('error', function(e) {
        console.log("Got error: ", e.message);
        cb(null, e);
    });
}

module.exports = quickGet;
