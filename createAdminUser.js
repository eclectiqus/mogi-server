var groupName = "Cape Town",
    admin = true,
    userName = 'admin',
    userEmail = 'user@email.com',
    userPass = 'admin'
    latitude = -33.920684,
    longitude = 18.425690;

var db = require('./lib/db');


group = db.group.build({name: groupName, isAdmin: admin, lat: latitude, lng: longitude });
group.save().then(function(group){
    var user = db.user.build({
        username : userName,
        email : userEmail,
        name : userName,
        groupId: group.id,
        isAdmin : admin
    });

    user.hashPassword(userPass, function() {
        user.save();
    });
});




