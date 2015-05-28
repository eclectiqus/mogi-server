var request = require('supertest'),
    should = require('should'),
    proxyquire =  require('proxyquire'),
    db = {},
    auth = require('./../mocks/auth'),
    streams = proxyquire('./../../lib/streams', { './../auth' : auth, './../db' : db }),
    api = request(streams);

describe('generate key for streaming room', function() {
  var user = { id : 1, username : "test" };

  beforeEach(function() {
    auth.user = user;
    auth.scope = 'client';
  });


    it('should return 200 with json', function(done) {
      api.post('/streams')
        .expect(200)
        .end(function(err, res) {
            res.body.should.have.property('id');
            res.body.id.should.have.length(36);
            done();
        });

  });
});
