var request = require('supertest'),
    should = require('should'),
    proxyquire =  require('proxyquire'),
    db = {},
    auth = require('./../mocks/auth'),
    users = proxyquire('./../../lib/users', { './../auth' : auth, './../db' : db }),
    api = request(users);

describe('Users Me Endpoint Tests', function() {

  describe('When user is authenticated', function() {
    var user = { id : 1, username : "test" };

    beforeEach(function() {
      auth.user = user;
      auth.scope = 'client';
    });

    //TODO it('should return 200 with json', function(done) {
    //  api.get('/users/me')
    //    .expect(200)
    //    .end(function(err, res) {
    //        res.body.username.should.equal(user.username);
    //        res.body.id.should.equal(user.id);
    //        done();
    //    });
    //});
  });
});
