[![Build Status](https://travis-ci.org/igarape/mogi-server.svg?branch=master)](https://travis-ci.org/igarape/mogi-server)

Copcast Server
===========

Copcast Server is part of the Copcast solution to help improve police accountability using mobile phones to record the video and the audio and register their GPS location.

Copcast Server is a server API developed with <a href="https://nodejs.org">Node.js</a> and <a href="http://expressjs.com">Express</a> 


## Dev Installation

First, install <a href="https://nodejs.org">Node.js</a> in your development machine. We are using, currently, version <b>0.10.40</b>.

Then make sure you have the following softwares installed:

   * ImageMagick
   * ffmpeg
   * PostgreSQL server and development files
   * gcc, gcc-c++ and make
   * bzip2


## Building

First make sure you have NodeJS and NPM properly installed (check http://nodejs.org for help).

```
npm install -g forever nodemon express sequelize-cli
npm install
```


## Database

The server requires a PostgreSQL database. To prepare your development environment, edit the following files:

   * lib/config/env/development.json
   * config/config.json

For both, edit the connection string and enter your database parameters, like _username_, _password_, _database_ and _host_.

Next, initialize your database:

```
psql -U _username_ -f copcast-db.sql
sequelize db:migrate:old_schema
sequelize db:migrate
NODE_ENV=development node createAdminUser.js
```


## Running

The last line will create your first user "admin" with the password "admin".
Finally, start your application:

```
NODE_ENV=development node app.js
```


## Deployment

1. Create a production.json file at /lib/config/env/
2. Save the db variable in the production.json for the server
3. On the project root folder run your service with _forever_.

```
NODE_ENV=development forever -o /var/log/mogi-server.out -e /var/log/mogi-server.err start app.js
```
