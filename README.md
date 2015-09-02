[![Build Status](https://travis-ci.org/igarape/mogi-server.svg?branch=master)](https://travis-ci.org/igarape/mogi-server)

Mogi Application Server
===========

Server API for the Project Mogi/SmartPolicing sollution

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

