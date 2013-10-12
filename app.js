$(document).ready(function() {
"use strict";




/////////////////////////////////////////////////
// Get jQuery objects for elements on the page //
/////////////////////////////////////////////////

var $face = $('#face');
var $name = $('#name');
var $guess_name = $('#guess-name');
var $give_up = $('#give-up');
var $guesses = $('#guesses');




////////////////////
// Set parameters //
////////////////////

var max_guesses = 3;




/////////////////////////////////////////
// Define functions for use in the app //
/////////////////////////////////////////

// Scrape the student page and return the data in cb(data, error)
function scrapeStudentsPage(cb) {
    $.get(
        'http://www.ed.ac.uk/schools-departments/geosciences/people',
        { cw_xml: 'students.html' },
        function(data) {
            cb(data, null);
        }
    );
}


// Scrape an individual's page from their id and return in cb(data, error)
function scrapeIndividualPage(indv, cb) {
    $.get(
        'http://www.ed.ac.uk/schools-departments/geosciences/people',
        {
            indv: indv,
            cw_xml: 'student.html'
        },
        function(data) {
            cb(data, null);
        }
    );
}


// Get a list of students {indv, name} and return in cb(students, error)
function getStudents(cb) {
    scrapeStudentsPage(function(data) {

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

        // Return all the parsed matches
        cb(matches, null);
    });
}


// Get data {face, name} for an individual from their id and return
// in cb(individual, error)
function getIndividual(indv, cb) {
    scrapeIndividualPage(indv, function(data) {
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

        cb(individual, null);
    });
}


// Return a random element from an array
function get_arr_random(array) {
    return array[Math.floor(Math.random()*array.length)];
}


// Reset everything
function reset_game() {
    $name.val(null);

    $face.attr('src', null);
    $face.data('name', 'None');

    $guess_name.data('num_guesses', max_guesses);

    $guesses.empty();
}


// Get a new face and set $face with .attr('src') pointing to a picture
// for the individual and .data('name') with the person's name
function get_new_face() {

    // Disable answering for a minute
    $face.data('name', 'None');

    // Scrape a new face and name
    getStudents(function(students) {
        (function localGetIndividual() {
            var student = get_arr_random(students);

            getIndividual(student.indv, function(individual) {

                // If dummy image, try again
                if(individual.face.match(/dummy.jpg/)) {
                    localGetIndividual();
                    return;
                }

                // If no name, try again
                if(individual.name == 'None') {
                    localGetIndividual();
                    return;
                }


                // Use Image so we can catch 404ed images
                var img = new Image;

                // When loaded, set face and name
                img.onload = function(e) {

                    // Clear everything
                    reset_game();

                    $face.attr('src', individual.face);
                    $face.data('name', individual.name);
                }

                // On error, rerun this function
                img.onerror = function() {
                    localGetIndividual();
                }

                img.src = individual.face;
            });
        })();
    });
}


// Check that the guess in $name is either the first name or whole name
// stored in $face.data('name')
function check_guess() {
    var guess = $name.val();
    var answer = $face.data('name');
    var first_name = answer.split(' ')[0];

    // Quick check that guess is not null before num_guesses is touched
    if(guess.length == 0) return;
    $name.val('');

    var num_guesses = $guess_name.data('num_guesses') - 1;
    $guess_name.data('num_guesses', num_guesses);


    function compare_names(n1, n2) {
        return n1.toLowerCase() == n2.toLowerCase();
    }

    // If right
    if(
        compare_names(guess, answer)
        || compare_names(guess, first_name)
    ) {
        $guesses.append("<li class='alert-success'>"+answer+"</li>");
        get_new_face();
    }
    // If wrong
    else {
        $guesses.append("<li class='alert-danger'>"+guess+"</li>");

        if(num_guesses <= 0) {
            $give_up.click();
        }
    }
}




////////////////////////////////////////
// Attach behaviours to page elements //
////////////////////////////////////////


// On clicking "guess", check guess
$guess_name.click(function() {
    check_guess();
});


// On pressing enter in the guess box, check guess
$name.keydown(function(e) {
    // If enter pressed
    if(e.keyCode == 13) check_guess();
});


// On giving up, put the correct answer in $name
$give_up.click(function() {
    $name.val($face.data('name'));
});




/////////////////////
// Initialise game //
/////////////////////

get_new_face();


});
