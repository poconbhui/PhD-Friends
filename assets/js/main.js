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



// Get a list of students {indv, name} and return in cb(students, error)
function getStudents(cb) {
    $.getJSON('/people', function(data) {
        // Return all the parsed matches
        cb(data, null);
    });
}


// Get data {face, name} for an individual from their id and return
// in cb(individual, error)
function getIndividual(indv, cb) {
    $.getJSON('/people/' + indv, function(data) {
        cb(data, null);
    });
}



// Shuffle array in place
// From: http://stackoverflow.com/a/2450976
function shuffle(array) {
    var currentIndex = array.length;
    var temporaryValue;
    var randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}


// Reset everything
function reset_game() {
    $guessed_name.val('');
    $guessed_name.attr('placeholder', '');

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

    // If no students, wait a bit and try again
    if(!$new_list.data('all') || !$new_list.data('sublist')) {
        setTimeout(get_new_face, 500);
        return;
    }

    var students = $new_list.data('sublist');

    // Not super efficient but OH WELL 
    var student_id = shuffle(students)[0];

    getIndividual(student_id, function(individual) {

        // If there was an error, try again
        if(individual.err) {
            setTimeout(get_new_face, 0);
            return;
        }

        // Want face to hang for about a second
        setTimeout(function() {
            // Clear everything
            reset_game();

            $face.attr(
                'src', 'data:image/jpeg;base64,' + individual.face
            );
            $face.data('name', individual.name);

            $guessed_name.focus();
        }, 1000);
    });
}


// Check that the guess in $guessed_name is either the first name or whole name
// stored in $face.data('name')
function check_guess(guess) {
    var answer = $face.data('name');
    var first_name = answer.split(' ')[0];

    var right_pos=0;

    var n1 = guess.toLowerCase().split(' ');
    var n2 = answer.toLowerCase().split(' ');

    for(right_pos=0; right_pos<n2.length; right_pos++) {
        if(n1[right_pos] != n2[right_pos]) {
            break;
        }
    }


    // If right
    if(right_pos) {
        var right = answer.split(' ').slice(0, right_pos).join(' ');
        var wrong = answer.split(' ').slice(right_pos).join(' ');

        return {right: right, wrong: wrong};

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
    var guess = $guessed_name.val();

    // Reset guess field for next guess
    $guessed_name.val('');


    // Quick check that guess is not null before num_guesses is touched
    if(guess.length == 0) return;

    var num_guesses = $make_guess.data('num_guesses') - 1;
    $make_guess.data('num_guesses', num_guesses);

    var correct = check_guess(guess);


    if(correct) {
        $guesses.append(
            "<li class='alert-success'>"
                + correct.right + " "
                + "<span class='text-danger'>" + correct.wrong + "</span>"
            + "</li>"
        );

        if(!$give_up.data('gave_up')) score.add(guess);

        get_new_face();
    }
    else {
        $guesses.append(
            "<li class='alert-danger'>"+guess+"</li>"
        );

        if(num_guesses <= 0) {
            $give_up.click();
            return;
        }
    }
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

    if(Modernizr.input.placeholder) {
        $guessed_name.attr('placeholder', $face.data('name'));
        $guessed_name.focus();
    }
    else {
        $guessed_name.val($face.data('name'));
    }

    $give_up.data('gave_up', true);
});


// Set up new list generation
$new_list.click(function() {
    getStudents(function(students) {
        $new_list.data('all', students);

        if(!$new_list.data('length')){
            // Length of 0 means use whole list
            $new_list.data('sublist', students);
        }
        else {
            $new_list.data(
                'sublist', shuffle(students).slice(0, $new_list.data('length'))
            );
        }
    });
}).click();


// Set up list length selection
$list_length_options.find('a').click(function() {
    var $this = $(this);

    // Unmark all options
    $list_length_options.find('a .glyphicon').remove();

    // Find value of current option
    var val = $this.text();

    // Parse value to integer
    if(val == 'all') val = 0;
    val = parseInt(val);

    $new_list.data('length', val);

    // Refresh the list
    $new_list.click();

    // Mark this option
    $this.append('  <span class="glyphicon glyphicon-ok"></span>');

    return false;
});

// Initially click the "all" option
$list_length_options.find('a:contains(all)').click();

// Make sure dropdown is closed on page load
$('.open .dropdown-toggle').dropdown('toggle');





/////////////////////
// Initialise game //
/////////////////////

get_new_face();


});
