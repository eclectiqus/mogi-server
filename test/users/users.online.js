var request = require('supertest'),
    should = require('should'),
    proxyquire =  require('proxyquire'),
    db = {},
    auth = require('./../mocks/auth'),
    users = proxyquire('./../../lib/users', { './../auth' : auth, './../db' : db }),
    api = request(users);

describe('Users Online Endpoint Tests', function() {

  beforeEach(function(done) {

    db.sequelize.sync({ force : true }).then(function(){
      done()
    });
  });

  describe('When there is on online user', function() {
    beforeEach(function(done){
      createGroup({name: 'Group Test'}, function(group){
        createUser({
          username : 'test',
          email : 'test@email.com',
          name : 'Test Name',
          groupId: group.id,
          isAdmin : true,
          language : 'pt',
          password: 'test',
          lastLocationUpdateDate: new Date(),
          lastLat: 25.000,
          lastLng: -34.000
        }, function(user){
          auth.user = user;
          auth.scope = 'admin';
          done();
        })
      });
    });


    it('should return one online user', function(done){
      api.get('/users/online')
        .expect(200)
        .end(function(err, res){
          res.body.length.should.equal(1);
          done();
        });
    });


  });
});

function createUser(user, done)
{
  var usr = db.user.build(user);

  usr.hashPassword(user.password, function() {
    usr.save().then(function() {
      done(usr);
    }).error(function(err) {
      done(null);
    });
  });
}

function createGroup(group, done){
  db.group
    .build(group)
    .save()
    .then(function(group) {
      done(group);
    });
}
