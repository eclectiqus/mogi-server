var express = require('express'),
    app = module.exports = express(),
    db = require('./../db'),
    fs = require('fs'),
    config = require('./../config'),
    auth = require('./../auth'),
    mime = require('mime');

app.get('/pictures/:userId/:size/show', function(req,res) {
    db.user.find(req.params.userId).then(function (user) {
        try{
            var path = 'pictures/'+user.id+'/'+req.params.size+'/'+user.profilePicture;
            fs.exists(path, function (exists) {
                if (!exists){
                  path = 'images/user_icon.png';
                }
                var picture = fs.readFileSync(path);
                var mimeType = mime.lookup(path);
                res.writeHead(200, {'Content-Type': mimeType });
                res.end(picture, 'binary');
            });
        }catch(err){
            res.status(404).send( 'No picture found');
        }
    });
});

app.get('/pictures/:size/show', auth.ensureToken, function(req,res) {
    try{
        var path = 'pictures/'+req.user.id+'/'+req.params.size+'/'+req.user.profilePicture;
        var picture = fs.readFileSync(path);
        var mimeType = mime.lookup(path);
        res.writeHead(200, {'Content-Type': mimeType });
        res.end(picture, 'binary');
    }catch(err){
        res.status(404).send( 'No picture found');
    }
});
