/*global describe, it */

/*
 * # License
 *
 * Copyright (c) 2012-2014 Yoovant by Marcello Gesmundo. All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *    * Redistributions of source code must retain the above copyright
 *      notice, this list of conditions and the following disclaimer.
 *    * Redistributions in binary form must reproduce the above
 *      copyright notice, this list of conditions and the following
 *      disclaimer in the documentation and/or other materials provided
 *      with the distribution.
 *    * Neither the name of Yoovant nor the names of its
 *      contributors may be used to endorse or promote products derived
 *      from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 */

var adminUsername = "admin";
var adminPassword = "admin";
var should = require('should');
var couchDB = require('../index.js')({
  debug: true,
  adminUsername: adminUsername,     // set your admin username
  adminPassword: adminPassword      // set your admin password
});
var conn;
var db;
var dbName = "test_database";
var dbUsername = "test_user";
var dbUserPassword = "password";

describe('Cradle Security test', function () {
  it('should open a new DB connection', function (done) {
    couchDB.setup({
      host: '127.0.0.1',
      port: 5984,
      cache: true,
      timeout: 5000
    });
    conn = new (couchDB.Connection)({
      auth: {
        username: adminUsername,
        password: adminPassword
      }
    });
    // small test because cradle has his test
    should.exists(conn);
    done();
  });
  it('should create a new database with new user', function (done) {
    db = conn.database(dbName);
    db.exists(function (err, exists) {
      if (!exists) {
        db.createWithUser(dbUsername, dbUserPassword, [ "admins" ], function (err, res) {
          res.ok.should.true;
          done();
        });
      }
    });
  });
  it('should delete database', function (done) {
    db = conn.database(dbName);
    db.destroy(done);
  });
  it('should create a new database with existing user', function (done) {
    db = conn.database(dbName);
    db.exists(function (err, exists) {
      if (!exists) {
        db.createWithUser(dbUsername, dbUserPassword, [ "admins" ], function (err, res) {
          res.ok.should.true;
          done();
        });
      }
    });
  });
  it('should delete database', function (done) {
    db = conn.database(dbName);
    db.destroy(done);
  });
  it('should delete user', function (done) {
    db = conn.database(dbName);
    db.delUser(dbUsername, function (err, res) {
      res.ok.should.true;
      done();
    });
  });
});