var People = require(__dirname + '/../models/people');

var left = [];

People.all(function(ids) {
    ids.forEach(function(id) {
        left.push(id);

        People.find(id, function() {
            var index = left.indexOf(id);
            if(index > -1) left.splice(index, 1);

            if(!left.length) process.exit();
        });
    });
});
