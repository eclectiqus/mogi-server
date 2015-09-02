[![Build Status](https://travis-ci.org/igarape/mogi-server.svg?branch=master)](https://travis-ci.org/igarape/mogi-server)

Copcast Server
===========

Copcast Server is part of the Copcast solution to help improve police accountability using mobile phones to record the video and the audio and register their GPS location.

Copcast Server is a server API developed with <a href="https://nodejs.org">Node.js</a> and <a href="http://expressjs.com">Express</a> 

## Dev Installation

First, install <a href="https://nodejs.org">Node.js</a> in your development machine. We are using, currently, version <b>0.10.40</b>.

## Building

First make sure you have NodeJS and NPM properly installed (check http://nodejs.org for help).

```
npm install -g forever nodemon express
npm install
```

## Database

The server requires a PostgreSQL database. The connection string should be put in the /lib/config/env/ json files.

## Deployment

1. Create a production.json file at /lib/config/env/
2. Save the db variable in the production.json for the server
3. On the project root folder run grunt server

After deployments it's required to re-run grunt server to restart the application

