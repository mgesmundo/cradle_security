/**
 * @class node_modules.cradle_security
 *
 * @author Marcello Gesmundo
 *
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
module.exports = function (config) {
  var utils   = require('object_utils');
  var util    = require('util');
  var couchDB = require('cradle');
  var async   = require('async');

  // namespace
  var my = {};

  // default prefix for userId
  var userPrefix = "org.couchdb.user:";

  /**
   * Configuration
   */
  my.config = {
    /**
     * @cfg {String} [name='cradle-security'] Module name to show in logs
     */
    name: '[cradle-security]',
    /**
     * @cfg {Boolean} [debug = false] Set true if you want trace running module
     */
    debug: false,
    /**
     * @cfg {Object} [logger = console] The logger used in debug mode. It MUST have
     * log, error, warn, info, debug methods
     */
    logger: console, // for best logging please use winston: npm install winston
    /**
     * @cfg {Array} adminRoles Default CouchDB admin roles
     */
    adminRoles: [ "admins" ],
    /**
     * @cfg {Array} memberRoles Default CouchDB user roles
     */
    memberRoles: [ "guests" ],
    /**
     * @cfg {String} adminUsername Default username for CouchDB administrator
     */
    adminUsername: "admin",
    /**
     * @cfg {String} adminPassword Default password for CouchDB administrator
     */
    adminPassword: "admin"
  };

  config = config || {};

  // merge new config with default config
  utils.merge(my.config, config);

  var debug  = my.config.debug;
  var logger = my.config.logger;
  var mName  = my.config.name;

  // empty function
  var emptyFn = function () {};

  // deactivate debug mode if logger is not available
  if (!logger) {
    debug = false;
  }

  if (debug) {
    if (logger && 'function' !== typeof logger.debug) {
      // console does not have debug method
      logger.debug = logger.log;
    }
  } else {
    logger = {
      debug: emptyFn,
      log: emptyFn,
      warn: emptyFn,
      error: emptyFn,
      info: emptyFn
    };
  }

  // default CouchDB _design/_aut document
  var doc_auth =  function (newDoc, oldDoc, userCtx, secObj) {
    if (newDoc._deleted === true) {
      // allow deletes by admins and matching users
      // without checking the other fields
      if (userCtx.roles.indexOf('_admin') !== -1) {
        return;
      }
      throw ({forbidden: 'Only admins may delete other user docs.'});
    }

    var is_server_or_database_admin = function (userCtx, secObj) {
      // see if the user is a server admin
      if (userCtx.roles.indexOf('_admin') !== -1) {
        return true; // a server admin
      }

      // see if the user is a database admin specified by name
      if (secObj && secObj.admins && secObj.admins.names) {
        if (secObj.admins.names.indexOf(userCtx.name) !== -1) {
          return true; // database admin
        }
      }

      // see if the user is a database admin specified by role
      if (secObj && secObj.admins && secObj.admins.roles) {
        var db_roles = secObj.admins.roles;
        var idx;
        for (idx = 0; idx < userCtx.roles.length; idx++) {
          var user_role = userCtx.roles[idx];
          if (db_roles.indexOf(user_role) !== -1) {
            return true; // role matches!
          }
        }
      }

      return false; // default to no admin
    };

    if (!is_server_or_database_admin(userCtx, secObj)) {
      throw ({
        forbidden: 'You may only read documents.'
      });
    }
  };

  /**
   * Add new user
   *
   * @param {String} username Username for new user
   * @param {String} password Password for new user
   * @param {Array} roles Roles to assign to new user
   * @param {Function} callback Function called when the user was created
   * @return {callback(err, res)} The callback to execute as result
   * @param {Object} callback.err Error during operation
   * @param {Object} callback.res Response of the operation
   */
  couchDB.Database.prototype.addUser = function (username, password, roles, callback) {
    var self = this;
    var userDb = this.connection.database('_users');
    // add user if it does not exists
    var realName = util.format('%s%s', userPrefix, username);
    userDb.get(realName, function (userErr, userDoc) {
      if (!userDoc) {
        userDb.save(realName, {
          name: username,
          password: password,
          roles: roles,
          type: 'user'
        }, function (err, res) {
          if (logger) {
            if (err) {
              logger.error('%s unable to create "%s" user on "%s" database due the error %s', mName, username, self.name, err.error.toUpperCase());
            } else {
              logger.info('%s "%s" user created on "%s" database', mName, username, self.name);
            }
          }
          return callback(err, res);
        });
      } else {
        logger.error('%s unable to create "%s" user on "%s" database due the error %s', mName, username, self.name, 'USER_EXISTS');
        return callback({
          error: 'user_exists',
          reason: 'The user could not be created because it already exists.'
        });
      }
    });
  };

  /**
   * Delete user
   *
   * @param {String} username Username of the to be deleted
   * @param {Function} callback Function called when the user was deleted
   * @return {callback(err, res)} The callback to execute as result
   * @param {Object} callback.err Error during operation
   * @param {Object} callback.res Response of the operation
   */
  couchDB.Database.prototype.delUser = function (username, callback) {
    var self = this;
    var userDb = this.connection.database('_users');
    var realName = util.format('%s%s', userPrefix, username);
    userDb.remove(realName, function (err, res) {
      if (logger) {
        if (err) {
          logger.error('%s unable to delete "%s" user on "%s" database due the error %s', mName, username, self.name, err.error.toUpperCase());
        } else {
          logger.info('%s "%s" user deleted on "%s" database', mName, username, self.name);
        }
      }
      return callback(err, res);
    });
  };

  /**
   * Add security document for authorization
   *
   * @private
   * @param {Function} callback Function called when the document was created
   * @return {callback(err, res)} The callback to execute as result
   * @param {Object} callback.err Error during operation
   * @param {Object} callback.res Response of the operation
   */
  couchDB.Database.prototype.addAuthorization = function (callback) {
    // add authorization
    var self = this;
    self.save('_design/_auth', {
      views: {},
      validate_doc_update: doc_auth
    }, function (err, res) {
      if (logger) {
        if (err) {
          logger.error('%s unable to create "_design/_auth" security document on "%s" database due the error %s', mName, self.name, err.error.toUpperCase());
        } else {
          logger.info('%s "_design/_auth" security document created on "%s" database', mName, self.name);
        }
      }
      return callback(err, res);
    });
  };

  /**
   * Add roles to a database for admins and readers
   *
   * @param {Array} adminRoles Roles to assign to administrator of the database
   * @param {Array} memberRoles Roles to assign to members of the database
   * @param {Function} callback Function called when the roles was created
   * @return {callback(err, res)} The callback to execute as result
   * @param {Object} callback.err Error during operation
   * @param {Object} callback.res Response of the operation
   */
  couchDB.Database.prototype.addRoles = function (adminRoles, memberRoles, callback) {
    // add admin user for newly database
    var self = this;
    self.save('_security', {
      admins: {
        roles: adminRoles
      },
      readers: {
        roles: memberRoles
      }
    }, function (err, res) {
      if (logger) {
        if (err) {
          logger.error('%s unable to create "%s" admin roles and/or "%s" readers roles on "%s" database due the error %s',
            mName, adminRoles.join(', '), memberRoles.join(', '), self.name, err.error.toUpperCase());
        } else {
          logger.info('%s "%s" admin roles and "%s" readers roles created on "%s" database',
            mName, adminRoles.join(', '), memberRoles.join(', '), self.name);
        }
      }
      return callback(err, res);
    });
  };

  /**
   * Create a new database and add new user
   *
   * @param {String} username Username for new user
   * @param {String} password Password for new user
   * @param {Array} roles Roles to assign to new user
   * @param {Function} callback Function called when the user was created
   * @return {callback(err, res)} The callback to execute as result
   * @param {Object} callback.err Error during operation
   * @param {Object} callback.res Response of the operation
   */
  couchDB.Database.prototype.createWithUser = function (username, password, roles, callback) {
    // create new database
    var self = this;

    self.create(function (errDb, resDb) {
      if (logger) {
        if (errDb) {
          logger.error('%s unable to create "%s" database due the error %s', mName, self.name, errDb.error.toUpperCase());
        }
      }
      if (errDb) {
        callback(errDb, resDb);
      } else {
        async.parallel({
          roles:  function (cb) {
            // add roles
            self.addRoles(my.config.adminRoles, my.config.memberRoles, cb);
          },
          user: function (cb) {
            var userDb = self.connection.database('_users');
            // add user if it does not exists
            var realName = util.format('%s%s', userPrefix, username);
            userDb.get(realName, function (userErr, userDoc) {
              if (!userDoc) {
                // add user to couchdb users
                self.addUser(username, password, roles, cb);
              } else {
                cb(null, {
                  ok: true,
                  id: userDoc._id,
                  rev: userDoc._rev
                });
              }
            });
          },
          auth: function (cb) {
            // add authorization
            self.addAuthorization(cb);
          }
        }, function (err, res) {
          if (logger) {
            if (err) {
              logger.error('%s unable to create "%s" database due the error %s', mName, self.name, err.error.toUpperCase());
            } else {
              logger.info('%s "%s" database created', mName, self.name);
            }
          }
          if (err) {
            callback(err, res);
          } else {
            callback(err, {ok: true});
          }
        });
      }
    });
  };

  /**
   * @return {Object} Database returned
   */
  return couchDB;
};
