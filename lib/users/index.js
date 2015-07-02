var express = require('express'),
    app = module.exports = express(),
    moment = require('moment'),
    db = require('./../db'),
    auth = require('./../auth'),
    config = require('./../config'),
    path = require('path'),
    templatesDir   = path.resolve(__dirname, '..', 'templates'),
    emailTemplates = require('email-templates'),
    nodemailer = require('nodemailer'),
    fs=require('fs'),
    Busboy = require('busboy'),
    mkdirp = require('mkdirp'),
    easyimg = require('easyimage'),
    rimraf = require('rimraf');

var smtpTransport = nodemailer.createTransport("SMTP",{
    service: config.email.service,
    auth: {
        user: config.email.user,
        pass: config.email.pass
    }
});

rmDir = function(dirPath, callback) {
    try { var files = fs.readdirSync(dirPath); }
    catch(err) { return callback(); }
    if(!files){ return callback(); }
    if (files.length > 0)
        for (var i = 0; i < files.length; i++) {
            var filePath = dirPath + '/' + files[i];
            if (fs.statSync(filePath).isFile())
                fs.unlinkSync(filePath);
            else
                rmDir(filePath, callback);
        }
    fs.rmdirSync(dirPath);
    callback();
};

var resizeImageToSize = function(path, basePath, sizeName, size, image, done) {
  var filePath = path.join(basePath, sizeName);
  var outputFilePath = path.join(filePath,image);
  var outputTempFilePath = path.join(filePath,"temp"+image);

  mkdirp(filePath, function (err) {
    if (err) {
      console.error('resizeImg err='+err+']');
      done(err);
      return;
    } else {
      easyimg.exec('convert '+basePath+"/original/"+image+' -resize ' +
        (size) + 'x' + (size) + '^  -gravity center -crop ' +
        (size) + 'x' + (size) + '+0+0 +repage '+outputTempFilePath).then(
        function(file) {

          easyimg.exec('convert '+outputTempFilePath+' \\( -size ' +
            (size) + 'x' + (size) + ' xc:none -fill white -draw "circle ' +
            (size / 2) + ',' + (size / 2) + ' ' + (size / 2) + ',0" \\) -compose copy_opacity -composite '+
            outputFilePath).then(
            function(file) {
              fs.unlink(outputTempFilePath, function (err) {
                if (err) {
                  console.log(err);
                  done(err);
                } else {
                  done();
                }
              });
            }, function (err) {
              done(err);
            }
          );
        }, function (err) {
          done(err);
        }
      );
    }
  });
}


app.get('/users/me', auth.ensureAdmin, function (req, res) {
    db.group.findById(req.user.groupId).then(function(group){
        res.json({
            id : req.user.id,
            username: req.user.username,
            lastLocationUpdateDate: req.user.lastLocationUpdateDate,
            profilePicture: req.user.profilePicture ? '/pictures/'+req.user.id+'/medium/show' : null,
            lastPos: req.user.lastLat != null && req.user.lastLng ? {lat:req.user.lastLat, lng:req.user.lastLng}:{},
            group: group != null ? {name: group.name , lat:group.lat, lng:group.lng, id: group.id, isGroupAdmin: group.isAdmin}:{},
            language: req.user.language
        });
    });
});

app.get('/users/online', auth.ensureAdmin, function(req,res) {
  var date = moment().subtract('minute', 10), where;

  db.group.findById(req.user.groupId).then(function(group){
      if (group == null ||  group.isAdmin === true){
          where = { lastLat : { ne : null }, lastLocationUpdateDate : { gte : date.toDate() }};
      } else {
          where = { lastLat : { ne : null }, lastLocationUpdateDate : { gte : date.toDate() }, groupId: req.user.groupId};
      }
      db.user.findAll({ where : where,
          attributes : ['id','name', 'lastLat', 'lastLng', 'groupId', 'profilePicture', 'username']})
        .then(function (users) {
          res.send(users.map(function(user) {
              return {
                  id : user.id,
                  name: user.name,
                  lat: user.lastLat,
                  lng: user.lastLng,
                  username: user.username,
                  profilePicture:  user.profilePicture ? '/pictures/'+user.id+'/medium/show' : null,
                  group: user.getGroup() != null ? user.getGroup().name  : null,
                  groupId: user.groupId

              }
          }));
        }).error(function (err) {
          console.log(err);
          res.sendStatus(500);
        });
  });
});

app.get('/users/streaming', auth.ensureAdmin, function(req, res){
  db.group.findById(req.user.groupId).then(function(group) {
    if (group == null || group.isAdmin === true) {
      res.send(app.get('streams').getStreams().map(function (user) {
        return {
          id: user.userId
        }
      }));
    } else {
      res.send(app.get('streams').getStreamsByGroup(req.user.groupId).map(function (user) {
        return {
          id: user.userId
        }
      }));
    }
  });
});

app.get('/users', auth.ensureAdmin, function (req, res) {
  db.group.findById(req.user.groupId).then(function(group){
      var where = [],
          params = [],
          page = req.query.page || 0,
          pageSize = req.query.pageSize || 25,
          select = ['SELECT DISTINCT U.id, U.username, U.\"lastLocationUpdateDate\", U.name, U.\"profilePicture\", G.name as group FROM "users" U LEFT OUTER JOIN "groups" G ON U."groupId" = G.id'];

      if ( req.query.user ) {
        req.query.user = '%' + req.query.user + '%';
        where.push('(U.username LIKE ? OR U.name LIKE ?)');
        params.push('%' + req.query.user + '%');
        params.push('%' + req.query.user + '%');
      }

      if (group == null || group.isAdmin === true){
          if (req.query.group ) {
              where.push('G.name LIKE ?');
              params.push('%' + req.query.group + '%');
          }
      } else {
          where.push('G.id = ?');
          params.push(group.id);
      }

      var query = select.join(' ') + ((where.length > 0) ? ' WHERE ' + where.join(' AND ') : '') + ' ORDER BY U.name';

      db.sequelize.query(query, { logging : console.log, raw : true, replacements : params, type: db.sequelize.QueryTypes.SELECT }).then(function(result) {
        res.send(result);
      });
  });
});

app.post('/users', auth.ensureAdmin, function (req, res) {
  var user = db.user.build({
    username : req.body.username,
    email : req.body.email,
    name : req.body.name,
    groupId: req.body.groupId,
    isAdmin : req.body.isAdmin
  });

  user.hashPassword(req.body.password, function() {
    user.save().then(function() {
      res.send(202);
    }).error(function(err) {
      res.send(422, err);
    });
  });
});

app.post('/users/:id/upload-picture',function(req,res) {
    var dirPath = 'pictures/'+req.params.id+'/original';
    db.user.findById(req.params.id).then(function(user) {
        if (!user){
            res.send(403);
        } else {
            var busboy = new Busboy({ headers: req.headers });
            busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
                rimraf('pictures/'+req.params.id, function(err){
                    if(err) {
                        console.error(err);
                        res.sendStatus(500);
                    } else {
                      mkdirp(dirPath, function (err) {
                        if (err) {
                          console.error(err);
                          res.sendStatus(500);
                        } else {
                          var filePath = path.join(dirPath, filename);
                          user.profilePicture = filename;
                          user.save().error(function (err) {
                            res.status(500).send(err);
                          }).then(function(){
                            file.pipe(fs.createWriteStream(filePath));
                            var err = null;
                            resizeImageToSize(path, 'pictures/' + req.params.id, "small", 40, user.profilePicture, function (err) {
                              if (err) {
                                res.status(500).send(err);
                              } else {
                                resizeImageToSize(path, 'pictures/' + req.params.id, "medium", 100, user.profilePicture, function (err) {
                                  resizeImageToSize(path, 'pictures/' + req.params.id, "icon", 80, user.profilePicture, function (err) {
                                    if (!err) {
                                      res.sendStatus(200);
                                    }
                                  });
                                });
                              }
                            });
                          });
                        }
                      });
                    }
                });
            });
            return req.pipe(busboy);
        }
    }).error(function(err) {
        res.status(500).send( err);
    });
});

app.post('/users/:id', auth.ensureAdmin, function(req,res) {
    db.group.findById(req.user.groupId).then(function(group){

        db.user.findById(req.params.id).then(function(user) {
          console.log("users_post" + user.id + " : " + user.name);
            if (group != null && group.isAdmin !== true && group.id != user.groupId){
                res.send(403);
            } else {
                user.updateAttributes(req.body).then(function(){
                    res.send(user);
                }).error(function(err) {
                    res.send(422, err);
                });
            }
        }).error(function(err) {
            res.status(500).send( err);
        });
    });
});

app.post('/users/:id/change-password', auth.ensureAdmin, function(req,res) {
    db.group.findById(req.user.groupId).then(function(group){
        db.user.findById(req.params.id).then(function(user) {
            if (group != null && group.isAdmin !== true && group.id != user.groupId){
                res.send(403);
            } else {
                user.validatePassword(req.body.password.oldPassword, function(valid) {
                    if (!valid ) {
                        res.send(403, 'Invalid password');
                    }else{
                        user.hashPassword(req.body.password.newPassword, function() {
                            user.save().then(function() {
                                res.sendStatus(200);
                            }).error(function(err) {
                                res.send(422, err);
                            });
                        });
                    }
                });
            }
        }).error(function(err) {
            res.status(500).send( err);
        });
    });
});

app.get('/users/:id', auth.ensureAdmin, function(req,res) {
    db.group.findById(req.user.groupId).then(function(group){
        db.user.findById(req.params.id).then(function(user) {
          //console.log("users_get" + user.id + " : " + user.name);
            if (group != null && group.isAdmin !== true && group.id != user.groupId){
                res.send(403);
            } else {
                res.send(user);
            }
        }).error(function(err) {
           res.status(500).send( err);
        });
    });
});

app.delete('/user_destroy/:id', auth.ensureAdmin, function(req,res) {
  db.user.findById(req.params.id).then(function(user) {
    if(!user) {
      return res.status(404).send( 'User does not exist');
    }
    else{
      if (user.getVideos().length > 0 )
      {
        res.send(403, "Has associated Videos");
      } else if ( user.getHistories().length > 0 ) {
        res.send(403, "Has associated Histories");
      } else if ( user.getLocations().length > 0 ) {
        res.send(403, "Has associated Locations");
      }
      else
      {
        user.destroy();  //destroy user
        res.sendStatus(200);
      };
    }
  }).error(function(err) {
    res.status(500).send( err);
  });
});


app.post('/users/:email/reset_password', function(req,res) {
    db.user.findOne({ where: { email:req.params.email } }).then(function(user) {
        if(!user) {
            return res.status(404).send( 'Email not found');
        }
        var randomString = Math.random().toString(36).slice(-8);
        sendEmail(req.params.email, randomString, user.username, function(success, errorMsg){
            if(!success){
                console.log(errorMsg);
                res.status(500).send( errorMsg);
            }
            user.hashPassword(randomString, function() {
                user.save().then(function() {
                    res.sendStatus(200);
                }).error(function(err) {
                    res.send(422, err);
                });
            });
        });
    }).error(function(err) {
        res.status(500).send( err);
    });
});

function sendEmail(email, password, username, callback){
    emailTemplates(templatesDir, function(err, template) {
        if (err) {
            console.log(err);
            callback(false, err);
        } else {
            var locals = {
                email: email,
                username: username,
                password:password
            };
            template(config.email.template, locals, function(err, html, text) {
                if (err) {
                    console.log(err);
                    callback(false, err);
                } else {
                    if(smtpTransport){
                        smtpTransport.sendMail({
                            from: config.email.from,
                            to: locals.email,
                            subject: config.email.subject,
                            html: html
                        }, function(err, responseStatus) {
                            if (err) {
                                console.log(err);
                                callback(false, err);
                            } else {
                                console.log(responseStatus.message);
                                callback(true);
                            }
                        });
                    }else{
                        callback(false, 'problems with smtpTransport. returning HTTP 500');
                    }
                }
            });
        }
    });
}
