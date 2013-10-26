var request = require('request');
var People = require(__dirname + '/../models/people');

var memjs = require('memjs').Client.create();


var FaceController = function() {
    this.show = function(req, res) {
        People.find(req.params.id, function(individual) {

            memjs.get(individual.face, function(err, value) {
                if(value) {
                    var body64 = value.toString();

                    res.header({'Content-Type': 'image/jpeg'});
                    res.end(new Buffer(body64, 'base64'), 'binary');
                }
                else {
                    request(
                        { url: individual.face, encoding: null },
                        function(err, headers, body) {
                            if(!err) {
                                var body64 = body.toString('base64');

                                memjs.set(individual.face, body64);

                                res.header({'Content-Type': 'image/jpeg'});
                                res.end(new Buffer(body64, 'base64'), 'binary');
                            }
                            else {
                                res.send(err);
                            }
                        }
                    );
                }
            });
        });
    };
}


module.exports = new FaceController();
