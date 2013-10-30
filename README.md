# Cradle Security

This module is a simple extension of the [Cradle][1] module for [CouchDB]() database.

## Install

To install this module use [npm](http://npmjs.org/) as usual:

    $ npm install cradle_security

    or

    $ npm install cradle_security --save-dev

    if you want to run tests.

## Usage

### CouchDB setup

    // load module
    var couchDB = require('cradle_security')({
        debug: true,                // set true to see all log messages
        adminUsername: "admin",     // set your admin username
        adminPassword: "password"   // set your admin password
    });

    // setup the database
    couchDB.setup({
        host: '127.0.0.1',          // CouchDB host (default localhost only)
        port: 5984,                 // CouchDB port
        cache: true,                // CouchDB cache
        timeout: 5000               // connection timeout
    });

    // create a new connection
    conn = new (couchDB.Connection)({
        auth: {
            username: "admin",      // set your admin username
            password: "password"    // set your admin password
        }
    });

### Create new database with new user

    db.createWithUser(
        "new_user",                 // username
        "new_user_password",        // password
        [ "admins" ],               // array of roles
        function (err, res) {       // callback
            console.log(res);       // it should be { ok: true } if no error occurred
        }
    );

### Create new user

    db.addUser(
        "new_user",                 // username
        "new_user_password",        // password
        [ "admins" ],               // array of roles
        function (err, res) {       // callback
            console.log(res);       // it should seem
                                    // { ok: true, id: 'org.couchdb.user:new_user', rev: '1-83d5aba64688501431753b7cc13d7578' }
                                    // if no error occurred
        }
    );

### Delete user

    db.delUser(
        "new_user",                 // username
        function (err, res) {       // callback
        console.log(res);           // it should seem
                                    // { ok: true, id: 'org.couchdb.user:new_user', rev: '2-645980a99208ef5902cb216e5a49526e' }
                                    // if no error occurred
        }
    );


### Add roles to the database

    db.addRoles(
        [ "admins" ],               // array of admin roles
        [ "guests" ],               // array of member roles
        function (err, res) {       // callback
            console.log(res);       // it should be { ok: true } if no error occurred
        }
    );


## Documentation

To create your own  documentation you must install [JSDuck](https://github.com/senchalabs/jsduck) and type in your terminal:

    $ cd /path-of-package
    $ ./gen_doc.sh


See full documentation into _doc_ folder and some examples into _test_ folder within the
[cradle_security](https://npmjs.org/package/cradle_security) package.

For all CouchDB supported function please refer to [cradle][1] documentation.

[1]: https://npmjs.org/package/cradle