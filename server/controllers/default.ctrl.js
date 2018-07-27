const md5 = require('md5');

class DefaultCtrl {
  constructor(app) {
    this.app = app;
    this.passport = this.app.server.passport;
    this.config = this.app.addons.addonsConfig['@materia/users'];
  }

  _generateKey() {
    return md5(Math.random()).substr(0, 8);
  }

  me(req, res, next) {
    return this.app.entities
      .get('user')
      .getQuery('get')
      .run(
        {
          id_user: req.user.id_user
        },
        { raw: true }
      )
      .then(user => {
        delete user.password;
        if (user.key_email !== undefined) {
          delete user.key_email;
        }
        if (user.key_password !== undefined) {
          delete user.key_password;
        }
        if (user.new_email !== undefined && user.new_email === null) {
          delete user.new_email;
        }
        delete user.salt;
        if (
          this.config &&
          this.config.user_profile_enabled &&
          this.config.user_profile_entity
        ) {
          const userProfileEntity = this.app.entities.get(
            this.config.user_profile_entity
          );
          return userProfileEntity
            .getQuery('getByUserId')
            .run(
              {
                id_user: req.user.id_user
              },
              { raw: true }
            )
            .then(userProfile => {
              return Object.assign({}, user, userProfile);
            })
            .catch(e => {
              return Promise.reject(e.message);
            });
        } else {
          return user;
        }
      });
  }

  destroy(req, res, next) {
    let params = Object.assign({}, req.body, req.params, req.query);
    let valid = false;
    if (req.user.email == params.email) {
      valid = true;
    } else {
      return Promise.reject('Confirmation failed');
    }
    if (valid) {
      return this.app.entities
        .get('user')
        .getQuery('delete')
        .run({
          id_user: req.user.id_user
        })
        .then(() => {
          req.logout();
          return {
            removed: true
          };
        });
    }
  }

  signin(req, res, next) {
    return new Promise((resolve, reject) => {
      console.log('before login');
      if (this.config && this.config.method == 'token') {
        req.body.client_id = req.body.email;
        req.body.client_secret = req.body.password;
        req.body.grant_type = 'client_credentials';
        console.log('before userClientPassword');
        this.passport.authenticate(
          'usersClientPassword',
          { session: false },
          (err, user) => {
            console.log('after', err, user);
            if (err) {
              return reject(err.message);
			}
			req.user = user;
            this.app.usersOAuthServer.token()(req, res, err => {
              if (err) {
                return reject(err.message);
              }
              console.log('after token', err);
              this.app.usersOAuthServer.errorHandler()(req, res, () => {
                if (err) {
                  return reject(err.message);
                }
                return resolve(user);
              });
            });
          }
        )(req, res, next);
      } else {
        this.passport.authenticate('local', function(err, user, info) {
          console.log('after authenticate', err, user, info);
          if (err) {
            return reject(err.message);
          }
          if (!user) {
            return reject(new Error('bad credentials'));
          }
          req.logIn(user, function(err) {
            console.log('after login', user, err);
            if (err) {
              return reject(err.message);
            }
            return resolve(user);
          });
        })(req, res, next);
      }
    });
  }

  signup(req, res, next) {
    let params = Object.assign({}, req.query, req.body, req.params);
    let user = this.app.entities.get('user');
    return user
      .getQuery('signup')
      .run(params)
      .then(() => {
        req.body.email = params.email;
        return this.signin(req, res);
      })
      .catch(e => {
        res.status(401).json({ error: e.message });
      });
  }

  logout(req, res, next) {
    req.logout();
    return Promise.resolve();
  }

  //Params: new_email
  //authenticated && type == (email | both)
  changeEmail(req, res, next) {
    let params = Object.assign({}, req.query, req.body);
    let userEntity = this.app.entities.get('user');

    let key = this._generateKey();

    if (this.config.email_verification) {
      return userEntity
        .getQuery('update')
        .run({
          id_user: req.user.id_user,
          new_email: params.new_email,
          key_email: key
        })
        .then(() => {
          return userEntity
            .getQuery('sendVerificationEmail')
            .run({
              id_user: req.user.id_user
            })
            .then(() => {
              req.user.new_email = params.new_email;
              return Promise.resolve({
                changed: true,
                verificationEmail: true
              });
            });
        });
    } else {
      return userEntity
        .getQuery('update')
        .run({
          id_user: req.user.id_user,
          email: params.new_email
        })
        .then(() => {
          req.user.email = params.new_email;
          return Promise.resolve({ changed: true, verificationEmail: false });
        });
    }
  }

  //Params: new_username
  //authenticated && type == (username | both)
  changeUsername(req, res, next) {
    let params = Object.assign({}, req.query, req.body);
    let userEntity = this.app.entities.get('user');
    return userEntity
      .getQuery('update')
      .run({
        id_user: req.user.id_user,
        username: params.new_username
      })
      .then(() => {
        req.user.username = params.new_username;
        return Promise.resolve({ changed: true });
      });
  }

  //Params: id_user & key & new_password
  changeLostPassword(req, res, next) {
    let params = Object.assign({}, req.params, req.body, req.query);
    let userEntity = this.app.entities.get('user');

    if (
      params.key &&
      params.id_user &&
      params.new_password &&
      this.config.email_verification &&
      (this.config.type == 'email' || this.config.type == 'both')
    ) {
      return userEntity
        .getQuery('get')
        .run(
          {
            id_user: params.id_user
          },
          { raw: true }
        )
        .then(user => {
          if (user.key_password == params.key) {
            let newPasswordEncrypted = md5(
              this.config.static_salt + params.new_password + user.salt
            );
            return userEntity
              .getQuery('update')
              .run({
                password: newPasswordEncrypted,
                key_password: null,
                id_user: user.id_user
              })
              .then(() => user);
          } else return Promise.reject('key does not match');
        })
        .then(user => {
          req.body.email = user.email;
          req.body.password = params.new_password;
          return this.signin(req, res, next);
        });
    } else {
      return res.status(500).send({
        error: true,
        message: 'Missing required parameter'
      });
    }
  }

  //old_password & new_password
  changePassword(req, res, next) {
    let params = Object.assign({}, req.params, req.body, req.query);
    let userEntity = this.app.entities.get('user');

    if (params.old_password && params.new_password) {
      if (!req.user || !req.user.id_user) {
        return res.status(401).send({
          error: true,
          message: 'Unauthorized call.'
        });
      }
      let staticSalt = this.config.static_salt;

      return userEntity
        .getQuery('get')
        .run(
          {
            id_user: req.user.id_user
          },
          { raw: true }
        )
        .then(user => {
          let encryptedOldPassword = md5(
            staticSalt + params.old_password + user.salt
          );
          let encryptedNewPassword = md5(
            staticSalt + params.new_password + user.salt
          );

          if (user.password == encryptedOldPassword) {
            return userEntity
              .getQuery('update')
              .run({
                id_user: req.user.id_user,
                password: encryptedNewPassword,
                key_password: null
              })
              .then(() => user);
          } else {
            return res.status(500).send({
              error: true,
              message: 'old password does not match'
            });
          }
        })
        .then(user => {
          req.body.email = user.email;
          req.body.password = params.new_password;
          return this.signin(req, res, next);
        });
    } else {
      return res.status(500).send({
        error: true,
        message: 'Missing required parameter'
      });
    }
  }

  verifyEmail(req, res, next) {
    let params = Object.assign({}, req.query, req.body, req.params);
    return this.app.entities
      .get('user')
      .getQuery('verifyEmail')
      .run(params)
      .then(redirect => {
        res.redirect(redirect);
        return Promise.resolve();
      });
  }
}
module.exports = DefaultCtrl;
