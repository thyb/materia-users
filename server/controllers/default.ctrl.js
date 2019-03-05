const bcrypt = require('bcryptjs');
const uuid = require('uuid/v4');

class DefaultCtrl {
  constructor(app) {
    this.app = app;
    this.passport = this.app.server.passport;
    this.config = this.app.addons.addonsConfig['@materia/users'];
  }

  me(req, res, next) {
    return this.app.entities
      .get('user')
      .getQuery('userInfo')
      .run({
        id_user: req.user.id_user
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
    if (this.config && this.config.method == 'token') {
      req.body.client_id = req.body.email;
      req.body.client_secret = req.body.password;
      req.body.grant_type = 'client_credentials';
      this.passport.authenticate(
        'usersClientPassword',
        { session: false },
        (err, user) => {
          if (err || !user) {
            return res.status(401).send({
              error: true,
              message: (err && err.message) || 'Bad credentials'
            });
          }
          req.user = user;
          this.app.usersOAuthServer.token()(req, res, err => {
            if (err) {
              res.status(401).json({
                error: true,
                message: err.message
              });
            }
            this.app.usersOAuthServer.errorHandler()(req, res, err => {
              if (err) {
                res.status(401).json({
                  error: true,
                  message: err.message
                });
              } else {
                res.status(200).json(user);
              }
            });
          });
        }
      )(req, res, next);
    } else {
      this.passport.authenticate('local', { session: false }, function (
        err,
        user
      ) {
        if (err) {
          res.status(401).json({
            error: true,
            message: err.message
          });
        }
        if (!user) {
          res.status(401).json({
            error: true,
            message: 'bad credentials'
          });
        }
        req.logIn(user, function (err) {
          if (err) {
            res.status(401).json({
              error: true,
              message: err.message
            });
          } else {
            res.status(200).json(user);
          }
        });
      })(req, res, next);
    }
  }

  signup(req, res, next) {
    let params = Object.assign({}, req.query, req.body, req.params);
    let user = this.app.entities.get('user');
    user
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
    req.logOut();
    res.status(200).json({ logout: true });
  }

  //Params: new_email
  //authenticated && type == (email | both)
  changeEmail(req, res, next) {
    let params = Object.assign({}, req.query, req.body);
    let userEntity = this.app.entities.get('user');

    let key = uuid();

    if (this.config.email_verification) {
      userEntity
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
              res.status(200).json({
                changed: true,
                verificationEmail: true
              });
            })
            .catch(e => {
              res.status(200).json({
                changed: true,
                verificationEmail: true
              });
            });
        })
        .catch(e => {
          res.status(400).json({
            error: true,
            message: e.message
          });
        });
    } else {
      userEntity
        .getQuery('update')
        .run({
          id_user: req.user.id_user,
          email: params.new_email
        })
        .then(() => {
          req.user.email = params.new_email;
          return Promise.resolve({ changed: true, verificationEmail: false });
        })
        .catch(e => {
          res.status(400).json({
            error: true,
            message: e.message
          });
        });
    }
  }

  //Params: new_username
  //authenticated && type == (username | both)
  changeUsername(req, res, next) {
    let params = Object.assign({}, req.query, req.body);
    let userEntity = this.app.entities.get('user');
    userEntity
      .getQuery('update')
      .run({
        id_user: req.user.id_user,
        username: params.new_username
      })
      .then(() => {
        req.user.username = params.new_username;
        res.status(200).json({ changed: true });
      })
      .catch(e => {
        res.status(400).json({
          error: true,
          message: e.message
        });
      });
  }

  //Params: id_user & key
  canResetPassword(req, res) {
    let params = Object.assign({}, req.params, req.body, req.query);

    this.app.entities
      .get('user')
      .getQuery('canResetPassword')
      .run(params)
      .then(user => {
        delete user.password;
        delete user.salt;
        delete user.key_email;
        delete user.id_stripe;
        res.status(200).send(user);
      })
      .catch(e => {
        res.status(400).send({
          message: e.message
        });
      });
  }

  //Params: id_user & key & new_password
  changeLostPassword(req, res, next) {
    let params = Object.assign({}, req.params, req.body, req.query);
    const userEntity = this.app.entities.get('user');
    
    bcrypt.hash(params.new_password, 10).then(hash => {
      userEntity
        .getQuery('canResetPassword')
        .run(params)
        .then(user =>
          userEntity
            .getQuery('update')
            .run({
              password: hash,
              key_password: null,
              id_user: params.id_user
            })
            .then(() => user)
        )
        .then(user => {
          req.body.email = user.email;
          req.body.password = params.new_password;
          this.signin(req, res, next);
        })
        .catch(e => {
          res.status(400).json({
            error: true,
            message: e.message
          });
        });
    });
  }

  //old_password & new_password
  changePassword(req, res, next) {
    let params = Object.assign({}, req.params, req.body, req.query);
    let userEntity = this.app.entities.get('user');

    if (!params.old_password || !params.new_password) {
      return res.status(500).send({
        error: true,
        message: 'Missing required parameter'
      });
    }
    if (!req.user || !req.user.id_user) {
      return res.status(401).send({
        error: true,
        message: 'Unauthorized call.'
      });
    }

    userEntity
      .getQuery('get')
      .run(
        {
          id_user: req.user.id_user
        },
        { raw: true }
      )
      .then(user => {
        return new Promise((resolve, reject) => {
          bcrypt.compare(params.old_password, user.password).then(res => {
            if (res) {
              bcrypt.hash(params.new_password, 10).then(newHash => {
                userEntity.getQuery('update')
                  .run({
                    id_user: req.user.id_user,
                    password: newHash,
                    key_password: null
                  })
                  .then(() => {
                    res.status(200).json(user);
                    resolve(user);
                  });
              })
            } else {
              res.status(500).send({
                error: true,
                message: 'old password does not match'
              });
              reject();
            }
          })
        })
      })
      .then(user => {
        req.body.email = user.email;
        req.body.password = params.new_password;
        this.signin(req, res, next);
      });
  }

  verifyEmail(req, res, next) {
    let params = Object.assign({}, req.query, req.body, req.params);
    this.app.entities
      .get('user')
      .getQuery('verifyEmail')
      .run(params)
      .then(redirect => {
        res.redirect(redirect);
        // res.status(200).send();
      })
      .catch(err => {
        res.status(400).json({
          error: true,
          message: err.message
        });
      });
  }

  sendVerificationEmail(req, res) {
    // let params = Object.assign({}, req.query, req.body, req.params);
    this.app.entities
      .get('user')
      .getQuery('sendVerificationEmail')
      .run({
        id_user: req.user.id_user
      })
      .then(() => {
        res.status(200).send();
      })
      .catch(e => {
        res.status(400).json({
          error: true,
          message: e.message
        });
      });
  }
}
module.exports = DefaultCtrl;
