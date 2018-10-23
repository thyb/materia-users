const md5 = require('md5');
const crypto = require('crypto');

class UserModel {
  constructor(app, model) {
    this.app = app;
    this.model = model;

    this.config = this.app.addons.addonsConfig['@materia/users'];
  }

  userInfo(params) {
    return this.app.entities
      .get('user')
      .getQuery('get')
      .run(
        {
          id_user: params.id_user
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
                id_user: params.id_user
              },
              { raw: true }
            )
            .then(userProfile => {
              return Object.assign({}, user, userProfile);
            })
            .catch(e => {
              return Promise.reject((e && e.message) || e || 'Unauthorized');
            });
        } else {
          return user;
        }
      });
  }

  _translate(message, user, redirect_url) {
    message = message.replace(
      new RegExp(`\\{{redirect_url\\}}`, 'gi'),
      redirect_url
    );
    this.app.entities
      .get('user')
      .getFields()
      .forEach(field => {
        if (
          field.name != 'password' &&
          field.name != 'salt' &&
          field.name != 'key' &&
          field.name != 'verified'
        ) {
          let e = new RegExp(`\\{\\{user.${field.name}\\}\\}`, 'gi');
          message = message.replace(e, user[field.name]);
        }
      });
    return message;
  }

  _generateKey() {
    return md5(Math.random()).substr(0, 8);
  }

  signup(params) {
    let user = this.app.entities.get('user');

    let password = params.password;
    let salt = this._generateKey();
    let staticSalt = this.config.static_salt;
    let encryptedPassword = md5(staticSalt + password + salt);

    params.password = encryptedPassword;
    params.salt = salt;
    params.key_email = this._generateKey();

    const paramsProfile = {};

    Object.keys(params).forEach(paramName => {
      if (['email', 'password', 'salt', 'key_email'].indexOf(paramName) == -1) {
        paramsProfile[paramName] = params[paramName];
        delete params[paramName];
      }
    });
    return user
      .getQuery('create')
      .run(params, { raw: true })
      .then(created => {
        let p = Promise.resolve(created);
        if (
          this.config &&
          this.config.user_profile_enabled &&
          this.config.user_profile_entity
        ) {
          const profileEntity = this.app.entities.get(
            this.config.user_profile_entity
          );
          paramsProfile.id_user = created.id_user;
          p = profileEntity
            .getQuery('create')
            .run(paramsProfile, { raw: true });
        }
        return p;
      })
      .then(created => {
        created.email = params.email;
        return this.sendVerificationEmail({ id_user: created.id_user })
          .then(() => created)
          .catch(e => {
            console.log(e);
            return created;
          });
      });
  }

  sendVerificationEmail(params) {
    if (
      this.config &&
      this.config.email_verification &&
      this.config.email_addon
    ) {
      return this.app.entities
        .get('user')
        .getQuery('get')
        .run(
          {
            id_user: params.id_user
          },
          { raw: true }
        )
        .then(user => {
          return this.userInfo(params).then(userSecure => {
            if (userSecure.verified && !user.new_email) {
              return Promise.reject(
                `Email '${userSecure.email}' has already been verified`
              );
            }

            let verify_url = `${this.app.server.getBaseUrl()}/user/verify/${
              user.id_user
            }/${user.key_email}`;

            let templateId = this.config.template_signup;
            let subject = this.config.subject_signup;
            if (user.new_email) {
              templateId = this.config.template_change_email;
              subject = this.config.subject_change_email;
            }
            let entity,
              query = 'sendTemplate',
              params = {
                to: user.new_email ? user.new_email : user.email,
                templateId: templateId,
                subject: subject,
                variables: JSON.stringify({
                  url_email_verification: verify_url
                })
              };

            if (this.config.email_addon == '@materia/mailjet') {
              entity = 'mailjet_message';
            } else if (this.config.email_addon == '@materia/sendgrid') {
              entity = 'sendgrid';
            }

            const emailEntity = this.app.entities.get(entity);
            if (!emailEntity) {
              return Promise.reject(
                'addon ' +
                  this.config.email_addon +
                  ' is not correctly installed: Entity not found.'
              );
            }
            const emailQuery = emailEntity.getQuery(query);
            if (!emailQuery) {
              return Promise.reject(
                'addon ' +
                  this.config.email_addon +
                  ' is not correctly installed: Query not found.'
              );
            }
            console.log('email: ' + JSON.stringify(params));
            return emailQuery.run(params).then(() => userSecure);
          });
        });
    } else {
      return Promise.reject('Email verification disabled');
    }
  }

  verifyEmail(params) {
    let userEntity = this.app.entities.get('user');
    return userEntity
      .getQuery('get')
      .run(
        {
          id_user: params.id_user
        },
        { raw: true }
      )
      .then(user => {
        let isSignup = true;
        if (
          user.key_email == params.key_email &&
          (!user.verified || user.new_email)
        ) {
          let updates = {
            verified: true,
            key_email: null,
            id_user: user.id_user
          };

          if (user.new_email) {
            updates.email = user.new_email;
            updates.new_email = '';
            isSignup = false;
          }

          return userEntity
            .getQuery('update')
            .run(updates)
            .then(() => {
              if (this.config.method == 'token') {
                return this._generateToken().then(token => {
                  const tokenHash = crypto
                    .createHash('sha1')
                    .update(token)
                    .digest('hex');
              
                  var expires = new Date();
                  expires.setDate(expires.getDate() + 1);

                  return this.app.entities.get('user_token').getQuery('create').run({
                    id_user: params.id_user,
                    expires_in: expires,
                    scope: '["*"]',
                    token: tokenHash
                  }).then(() => token);
                });
              } else {
                return Promise.resolve();
              }
            }).then(token => {
              if (isSignup) {
                return this.config.redirect_signup + (token ? '?access_token=' + token : '');
              } else {
                return this.config.redirect_change_email + (token ? '?access_token=' + token : '');
              }
            });
        } else {
          return Promise.reject('User email found but the key mismatch.');
        }
      });
  }

  _buildRedirectUri(redirect_url, params) {
    let newUrl = redirect_url;
    if (newUrl.substr(0, 1) == '/') {
      newUrl = this.app.server.getBaseUrl('/');
      newUrl = newUrl.substr(0, newUrl.length - 1) + redirect_url;
    }
    if (newUrl.split('?').length > 1) {
      newUrl += '&';
    } else {
      newUrl += '?';
    }
    Object.keys(params).forEach((p, index) => {
      newUrl += p + '=' + params[p];
      if (index + 1 < Object.keys(params).length) {
        newUrl += '&';
      }
    });
    return newUrl;
  }

  _generateToken({
    stringBase = 'base64',
    byteLength = 32
  } = {}) {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(byteLength, (err, buffer) => {
        if (err) {
          reject(err);
        } else {
          console.log(buffer.toString(stringBase), buffer.toString(stringBase).replace(/[ =]/g, ''))
          resolve(buffer.toString(stringBase).replace(/[ =+/\\]/g, ''));
        }
      });
    });
  }

  _execLostPassword(user) {
    let key = this._generateKey();

    return this.app.entities
      .get('user')
      .getQuery('update')
      .run({
        key_password: key,
        id_user: user.id_user
      })
      .then(() => {
        return this.userInfo(user).then(userSecure => {
          let redirect_url = this._buildRedirectUri(
            this.config.redirect_lost_password,
            {
              id_user: user.id_user,
              key: key
            }
          );
          let subject = this._translate(
            this.config.subject_lost_password,
            user,
            redirect_url
          );

          let entity, query, params;
          if (this.config.email_addon == '@materia/mailjet') {
            entity = 'mailjet_message';
            query = 'sendTemplate';
            params = {
              to: user.email,
              templateId: this.config.template_lost_password,
              subject: this.config.subject_lost_password,
              variables: {
                url_lost_password: redirect_url
              }
            };
          }
          //send the email
          return this.app.entities
            .get(entity)
            .getQuery(query)
            .run(params);
        });
      });
  }

  canResetPassword(params) {
    let userEntity = this.app.entities.get('user');
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
          return Promise.resolve(user);
        } else {
          return Promise.reject('key does not match');
        }
      });
  }

  /**
   *
   * @param {*} params
   */
  lostPassword(params) {
    if (!this.config.email_verification) {
      return Promise.reject(
        'Email verification not configured - Lost password functionality disabled'
      );
    }
    return this.app.entities
      .get('user')
      .getQuery('getByEmail')
      .run(
        {
          email: params.email
        },
        { raw: true }
      )
      .then(user => {
        if (user) {
          return this._execLostPassword(user);
        } else {
          return Promise.reject(new Error('Invalid email'));
        }
      })
      .then(() => {
        return { emailSent: true };
      })
      .catch(err => Promise.reject(err.message));
  }
}
module.exports = UserModel;
