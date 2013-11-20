$(document).ready(function() {
"use strict";




/////////////////////////////////////////////////
// Get jQuery objects for elements on the page //
/////////////////////////////////////////////////

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

    var _score = 0;

    this.getScore = function() {
        return _score;
    }

    this.add = function(name) {
        var value = name.split(' ').length;

        _score += value;

        $score.html(_score);
    }

    this.remove = function(name) {
        var value = name.split(' ').length;

        _score -= value;

        $score.html(_score);
    }


    // Initialize score container
    $score.html('0');
};


var face = new function() {
    var $face = $('#face');

    var _name;
    var _image64;


    this.set = function(name, image64) {
        _name = name;
        _image64 = image64;

        $face.data('name', name);
        $face.attr('src', 'data:image/jpeg;base64,' + image64);
    }

    this.reset = function() {
        _name = 'None';
        _image64 = null;

        $face.data('name', 'None');
        $face.attr('src', null);
    }


    this.getName = function() {
        return _name;
    }
    this.getImage64 = function() {
        return _image64;
    }
};


var guessed_name = new function() {
    var $guessed_name = $('#guessed-name');


    this.setVal = function(val) {
        $guessed_name.val(val);
    }

    this.getVal = function() {
        return $guessed_name.val();
    }


    this.setPlaceholder = function(val) {
        if(Modernizr.input.placeholder) {
            $guessed_name.attr('placeholder', face.getName());
        }
        else {
            $guessed_name.val(face.getName());
        }
    }

    this.clearPlaceholder = function() {
        $guessed_name.attr('placeholder', '');
    }


    this.focus = function() {
        $guessed_name.focus();
    }


    this.reset = function() {
        this.setVal('');
        this.clearPlaceholder();
    }



    // On pressing enter in the guess box, press the make guess button
    $guessed_name.keydown(function(e) {
        // If enter pressed
        if(e.keyCode == 13) make_guess.check_guess();
    });
};



var make_guess = new function() {
    var $make_guess = $('#make-guess');


    var _max_guesses = max_guesses; // Set from parameters at top
    var _current_guesses;


    this.check_guess = function() {
        var guess = guessed_name.getVal();

        // Quick check that guess is not null before anything is done
        if(guess.length == 0) return;


        // Reset guess field for next guess
        guessed_name.reset();


        // Increment current guess count
        _current_guesses += 1;

        // If over the guess limit, automatically click $give_up
        if(_current_guesses > _max_guesses) {
            give_up.give_up();
        }


        // Check correctness of guess
        var correct = check_guess(guess);


        if(correct) {
            guesses.add(correct);

            if(!give_up.is_given_up()) score.add(guess);

            get_new_face();
        }
        else {
            guesses.add({wrong:guess});

            if(_current_guesses >= _max_guesses) {
                give_up.give_up();
                return;
            }
        }
    }



    this.reset = function() {
        _current_guesses = 0;
    }


    //Attach check_guess to $make_guess.click
    $make_guess.click(this.check_guess);
};



var give_up = new function() {
    var $give_up = $('#give-up');

    var _given_up = false;


    // On giving up, put the correct answer in $guessed_name
    // and remove the appropriate score
    this.give_up = function() {
        // Ensure score is only removed once
        if(!_given_up) score.remove(face.getName());

        guessed_name.setPlaceholder(face.getName());
        guessed_name.focus();

        _given_up = true;
    }

    this.is_given_up = function() {
        return _given_up;
    }

    this.reset = function() {
        _given_up = false;
    }


    this.click = function() {
    }


    // Attach click behaviour to element
    $give_up.click(this.give_up);
};



var guesses = new function() {
    var $guesses = $('#guesses');


    this.add = function(guess) {
        var right = guess.right;
        var wrong = guess.wrong;

        if(right && right.length) {
            // At least one word right!
            $guesses.append(
                "<li class='alert-success'>"
                    + right + " "
                    + "<span class='text-danger'>" + wrong + "</span>"
                + "</li>"
            );
        }
        else {
            $guesses.append(
                "<li class='alert-danger'>" + wrong + "</li>"
            );
        }
    }


    this.reset = function() {
        $guesses.empty();
    }
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
    guessed_name.reset();

    face.reset();

    make_guess.reset();

    give_up.reset();

    guesses.reset();
}


// Get a new face and set $face with .attr('src') pointing to a picture
// for the individual and .data('name') with the person's name
function get_new_face() {

    // Disable answering for a minute
    $('#guessed-name').prop('disabled', true);

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

            face.set(individual.name, individual.face);

            $('#guessed-name').prop('disabled', false);
            guessed_name.focus();
        }, 1000);
    });
}


// Check that the guess in $guessed_name is either the first name or whole name
// stored in $face.data('name')
function check_guess(guess) {
    var answer = face.getName();
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
