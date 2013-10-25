$(document).ready(function() {
"use strict";




/////////////////////////////////////////////////
// Get jQuery objects for elements on the page //
/////////////////////////////////////////////////

var $face = $('#face');
var $guessed_name = $('#guessed-name');
var $make_guess = $('#make-guess');
var $give_up = $('#give-up');
var $guesses = $('#guesses');
var $new_list = $('#new-list');
var $list_length = $('#list-length');
var $list_length_options = $('#list-length-options');




////////////////////
// Set parameters //
////////////////////

var max_guesses = 3;
var name_per_round = 10;




/////////////////////////////////////////
// Define functions for use in the app //
/////////////////////////////////////////


var score = new function() {
    var $score = $('#score');
    var score = 0;

    this.getScore = function() {
        return score;
    }

    this.add = function(name) {
        var value = name.split(' ').length;

        score += value;

        $score.html(score);
    }

    this.remove = function(name) {
        var value = name.split(' ').length;

        score -= value;

        $score.html(score);
    }


    $score.html('0');
};


// Scrape the student page and return the data in cb(data, error)
function scrapeStudentsPage(cb) {
    $.get(
        '/people',
        { cw_xml: 'students.html' },
        function(data) {
            cb(data, null);
        }
    );
}


// Scrape an individual's page from their id and return in cb(data, error)
function scrapeIndividualPage(indv, cb) {
    $.get(
        '/people',
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
var getStudentsCache = [];
function getStudents(cb) {
    if(getStudentsCache.length) {
        cb(getStudentsCache, null);
    }
    else {
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

            // Cache results
            getStudentsCache = matches;

            // Return all the parsed matches
            cb(matches, null);
        });
    }
}


// Get data {face, name} for an individual from their id and return
// in cb(individual, error)
var getIndividualCache = {};
function getIndividual(indv, cb) {
    if(getIndividualCache[indv]) {
        cb(getIndividualCache[indv], null);
    }
    else {
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

            // Add individual to cache
            getIndividualCache[indv] = individual;

            cb(individual, null);
        });
    }
}


// Return a random element from an array within a focus
function get_arr_random(array, start, end) {
    var elem = Math.floor(start + Math.random()*(end - start));
    //var elem = Math.floor(Math.random()*array.length)
    
    return array[elem];
}


// Reset everything
function reset_game() {
    $guessed_name.val('');

    $face.attr('src', null);
    $face.data('name', 'None');

    $make_guess.data('num_guesses', max_guesses);

    $give_up.data('gave_up', false);

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
            var focus = $new_list.data('start') || 0;
            var width = $new_list.data('length') || students.length-1;

            var student = get_arr_random(students, focus, focus + width);

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

                // Generate setting function
                // Expect it to be called twice before running
                var set_face = (function() {
                    var count = 0;

                    return function() {
                        count = count + 1;

                        if(count == 2) {
                            // Clear everything
                            reset_game();

                            $face.attr('src', individual.face);
                            $face.data('name', individual.name);

                            $guessed_name.focus();
                        }
                    }
                })();

                // Want face to hang for about a second
                setTimeout(set_face, 1000);


                // Use Image so we can catch 404ed images
                var img = new Image;

                // When loaded, set face and name
                img.onload = set_face;

                // On error, rerun this function
                img.onerror = function() {
                    localGetIndividual();
                }

                img.src = individual.face;
            });
        })();
    });
}


// Check that the guess in $guessed_name is either the first name or whole name
// stored in $face.data('name')
function check_guess() {
    var guess = $guessed_name.val();
    var answer = $face.data('name');
    var first_name = answer.split(' ')[0];


    function compare_names() {
        var n1 = guess.toLowerCase().split(' ');
        var n2 = answer.toLowerCase().split(' ');

        for(var i=0; i<n2.length; i++) {
            if(n1[i] != n2[i]) {
                break;
            }
        }

        return i;
    }


    // If right
    if(compare_names()) {

        return true;

    }
    // If wrong
    else {

        return false;

    }
}




////////////////////////////////////////
// Attach behaviours to page elements //
////////////////////////////////////////


// On clicking "guess", check guess
$make_guess.click(function() {
    // Quick check that guess is not null before num_guesses is touched
    if($guessed_name.val().length == 0) return;

    var num_guesses = $make_guess.data('num_guesses') - 1;
    $make_guess.data('num_guesses', num_guesses);

    var correct = check_guess();

    if(correct) {
        $guesses.append("<li class='alert-success'>"+$face.data('name')+"</li>");

        if(!$give_up.data('gave_up')) score.add($guessed_name.val());

        get_new_face();
    }
    else {
        $guesses.append("<li class='alert-danger'>"+$guessed_name.val()+"</li>");

        if(num_guesses <= 0) {
            $give_up.click();
            return;
        }
    }

    // Reset guess field for next guess
    $guessed_name.val('');
});


// On pressing enter in the guess box, check guess
$guessed_name.keydown(function(e) {
    // If enter pressed
    if(e.keyCode == 13) $make_guess.click();
});


// On giving up, put the correct answer in $guessed_name
// and remove the appropriate score
$give_up.click(function() {
    if(!$give_up.data('gave_up')) score.remove($face.data('name'));
    $guessed_name.val($face.data('name'));

    $give_up.data('gave_up', true);
});


// Set up new list generation
$new_list.click(function() {
    // If working over the whole list, always start at 0
    if(!$new_list.data('length')){
        $new_list.data('start', 0);
        return;
    }

    getStudents(function(students) {
        $new_list.data('start', Math.floor(Math.random()*students.length));
    });
}).click();


// Set up list length selection
$list_length_options.find('a').click(function() {
    var $this = $(this);

    // Unmark all options
    $list_length_options.find('a .glyphicon').remove();

    // Find value of current option
    var val = $this.text();

    if(val == 'all') val = 0;

    val = parseInt(val);

    console.log(val);

    $new_list.data('length', val);

    // Get a new list for the new number
    $new_list.click();

    // Mark this option
    $this.append('  <span class="glyphicon glyphicon-ok"></span>');
});

// Initially click the "all" option
$list_length_options.find('a:contains(all)').click();





/////////////////////
// Initialise game //
/////////////////////

get_new_face();


});
