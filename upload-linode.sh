#!/bin/sh

user=root
server=mogi.igarape.org


echo $user
echo $server

ssh ${user}@${server} "

echo 'Uploading server'
cd /home/mogi/mogi-server/

forever stop app.js

git pull

npm install

export NODE_ENV=production

./node_modules/sequelize/bin/sequelize migrate

nohup forever start -o forever/out.log -e forever/err.log app.js

echo 'Uploading admin'

cd /home/mogi/mogi-admin/

git pull

npm install

bower install

grunt build

exit
"
