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
    os = require('os'),
    Busboy = require('busboy'),
    mkdirp = require('mkdirp'),
    gm = require('gm').subClass({ imageMagick: true }),
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

resizeImg = function(basePath, image){
    var smallPath = path.join(basePath,'small');
    var mediumPath = path.join(basePath,'medium');
    var smallOutputFilePath = path.join(smallPath,image);
    var mediumOutputFilePath = path.join(mediumPath,image);
    mkdirp(smallPath, function (err) {
        if (err) {
            console.error('resizeImg err='+err+']');
            return;
        } else {
            gm(basePath+'/original/'+image)
                .resize(100, 100)
                .noProfile()
                .write(smallOutputFilePath, function (err) {
                    if (err) console.log(err);
                });
        }
    });
    mkdirp(mediumPath, function (err) {
        if (err) {
            console.error('resizeImg err='+err+']');
            return;
        } else {
            gm(basePath+'/original/'+image)
                .resize(100, 100)
                .noProfile()
                .write(mediumOutputFilePath, function (err) {
                    if (err) console.log(err);
                });
        }
    });
};

app.get('/users/me', auth.ensureAdmin, function (req, res) {
    db.Group.find(req.user.groupId).success(function(group){
      console.log("users_me");
        res.json({
            id : req.user.id,
            username: req.user.username,
            lastLocationUpdateDate: req.user.lastLocationUpdateDate,
            profilePicture: req.user.profilePicture ? '/pictures/'+req.user.id+'/original/show' : null,
            lastPos: req.user.lastLat != null && req.user.lastLng ? {lat:req.user.lastLat, lng:req.user.lastLng}:{},
            group: group != null ? {name: group.name , lat:group.lat, lng:group.lng, id: group.id, isGroupAdmin: group.isAdmin}:{}});
    });
});

app.get('/users/online', auth.ensureAdmin, function(req,res) {
  var date = moment().subtract('minute', 10), where;

  db.Group.find(req.user.groupId).success(function(group){
      if (group == null ||  group.isAdmin === true){
          where = { lastLat : { ne : null }, lastLocationUpdateDate : { gte : date.toDate() }};
      } else {
          where = { lastLat : { ne : null }, lastLocationUpdateDate : { gte : date.toDate() }, groupId: req.user.groupId};
      }
      db.User.findAll({ where : where,
          attributes : ['id','name', 'lastLat', 'lastLng', 'groupId', 'profilePicture', 'username']})
        .success(function (users) {
          res.send(users.map(function(user) {
              return {
                  id : user.id,
                  name: user.name,
                  lat: user.lastLat,
                  lng: user.lastLng,
                  username: user.username,
                  profilePicture:  user.profilePicture ? '/pictures/'+user.id+'/original/show' : null,
                  group: user.getGroup() != null ? user.getGroup().name  : null,
                  groupId: user.groupId,
                  streamUrl: "rtmp://"+config.wowza.ipAddress+":"+config.wowza.port+config.wowza.path+user.id+".stream"
              }
          }));
        }).error(function (err) {
          console.log(err);
          res.send(500);
        });
  });
});

app.get('/users', auth.ensureAdmin, function (req, res) {
  db.Group.find(req.user.groupId).success(function(group){
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

      db.sequelize.query(query, null, { logging : console.log, raw : true }, params).success(function(result) {
        res.send(result);
      });
  });
});

app.post('/users', auth.ensureAdmin, function (req, res) {
  var user = db.User.build({
    username : req.body.username,
    email : req.body.email,
    name : req.body.name,
    groupId: req.body.groupId,
    isAdmin : req.body.isAdmin
  });

  user.hashPassword(req.body.password, function() {
    user.save().success(function() {
      res.send(202);
    }).error(function(err) {
      res.send(422, err);
    });
  });
});

app.post('/users/:id/upload-picture',function(req,res) {
    var dirPath = 'pictures/'+req.params.id+'/original';
    db.User.find(req.params.id).success(function(user) {
        if (!user){
            res.send(403);
        } else {
            var busboy = new Busboy({ headers: req.headers });
            busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
                rimraf('pictures/'+req.params.id, function(err){
                    if(err) {
                        console.error(err);
                        res.send(500);
                    }
                    mkdirp(dirPath, function (err) {
                        if (err) {
                            console.error(err);
                            res.send(500);
                        } else {
                            var filePath = path.join(dirPath,filename);
                            user.profilePicture = filename;
                            user.save().error(function(err) {
                                res.send(500, err);
                            });
                            file.pipe(fs.createWriteStream(filePath));
                            resizeImg('pictures/'+req.params.id, user.profilePicture);
                        }
                    });
                });
            });
            busboy.on('finish', function() {
                res.send(200);
            });
            return req.pipe(busboy);
        }
    }).error(function(err) {
        res.send(500, err);
    });
});

app.post('/users/:id', auth.ensureAdmin, function(req,res) {
    db.Group.find(req.user.groupId).success(function(group){

        db.User.find(req.params.id).success(function(user) {
          console.log("users_post" + user.id + " : " + user.name);
            if (group != null && group.isAdmin !== true && group.id != user.groupId){
                res.send(403);
            } else {
                user.updateAttributes(req.body).success(function(){
                    res.send(user);
                }).error(function(err) {
                    res.send(422, err);
                });
            }
        }).error(function(err) {
            res.send(500, err);
        });
    });
});

app.post('/users/:id/change-password', auth.ensureAdmin, function(req,res) {
    db.Group.find(req.user.groupId).success(function(group){
        db.User.find(req.params.id).success(function(user) {
            if (group != null && group.isAdmin !== true && group.id != user.groupId){
                res.send(403);
            } else {
                user.validatePassword(req.body.password.oldPassword, function(valid) {
                    if (!valid ) {
                        res.send(403, 'Invalid password');
                    }else{
                        user.hashPassword(req.body.password.newPassword, function() {
                            user.save().success(function() {
                                res.send(200);
                            }).error(function(err) {
                                res.send(422, err);
                            });
                        });
                    }
                });
            }
        }).error(function(err) {
            res.send(500, err);
        });
    });
});

app.get('/users/:id', auth.ensureAdmin, function(req,res) {
    db.Group.find(req.user.groupId).success(function(group){
        db.User.find(req.params.id).success(function(user) {
          //console.log("users_get" + user.id + " : " + user.name);
            if (group != null && group.isAdmin !== true && group.id != user.groupId){
                res.send(403);
            } else {
                res.send(user);
            }
        }).error(function(err) {
           res.send(500, err);
        });
    });
});

app.post('/user_destroy/:id', auth.ensureAdmin, function(req,res) {
  db.User.find({ where: { id:req.params.id } }).success(function(user) {
    if(!user) {
      return res.send(404, 'User does not exist');
    }
    var my_message = "User : " + user.name + " was success removed!";
    var my_sql = "delete from users where id = " + user.id; //colocar parametros
    //console.log("users_destroy_sql:" + my_sql);
    //destroy user

     db.sequelize.query(my_sql ).success(function(result) {
        //console.log("users_my_messsage:" + my_sql);
        res.send(200, my_message );
     });

    /*
    sequelize.query("SELECT * FROM `users`", { type: sequelize.QueryTypes.SELECT})
      .then(function(users) {
        // We don't need spread here, since only the results will be returned for select queries
      })
*/

  }).error(function(err) {
    res.send(500, err);
  });


});


app.post('/users/:email/reset_password', function(req,res) {
    db.User.find({ where: { email:req.params.email } }).success(function(user) {
        if(!user) {
            return res.send(404, 'Email not found');
        }
        var randomString = Math.random().toString(36).slice(-8);
        sendEmail(req.params.email, randomString, user.username, function(success, errorMsg){
            if(!success){
                console.log(errorMsg);
                res.send(500, errorMsg);
            }
            user.hashPassword(randomString, function() {
                user.save().success(function() {
                    res.send(200);
                }).error(function(err) {
                    res.send(422, err);
                });
            });
        });
    }).error(function(err) {
        res.send(500, err);
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
