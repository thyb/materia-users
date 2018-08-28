const md5 = require('md5');

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
        return created;
        // return this.sendVerificationEmail({ id_user: created.id_user })
        //   .then(() => created)
        //   .catch(() => created);
      });
  }

  sendVerificationEmail(params) {
    if (this.config && this.config.email_addon) {
      return this.userInfo(params).then(user => {
        let verify_url = `${this.app.server.getBaseUrl()}/user/verify/${
          user.id_user
        }/${user.key_email}`;

        let templateId = this.config.templates && this.config.templates.signup;
        if (user.new_email) {
          templateId =
            this.config.templates && this.config.templates.change_email;
        }
        let entity,
          query = 'sendTemplate',
          params = {
            to: user.email,
            templateId: templateId,
            subject: subject,
            variables: Object.assign({}, user, {
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
        return emailQuery.run(params).then(() => user);
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
              if (isSignup) {
                return this.config.email_signup.redirect_url;
              } else {
                return this.config.email_change_email.redirect_url;
              }
            });
        } else return Promise.reject('User email found but the key mismatch.');
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
        let redirect_url = this._buildRedirectUri(
          this.config.email_lost_password.redirect_url,
          {
            id_user: user.id_user,
            key: key
          }
        );
        let subject = this._translate(
          this.config.email_lost_password.subject,
          user,
          redirect_url
        );
        let message = this._translate(
          this.config.email_lost_password.message,
          user,
          redirect_url
        );

        //send the email
        return this.app.entities
          .get(this.config.email_action.entity)
          .getQuery(this.config.email_action.query)
          .run({
            to: user.email,
            subject: subject,
            body: message
          });
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
    let userPromise = Promise.resolve();
    if (this.config.type == 'email' || this.config.type == 'both') {
      userPromise = this.app.entities
        .get('user')
        .getQuery('getByEmail')
        .run(
          {
            email: params.email
          },
          { raw: true }
        );
    }
    return userPromise
      .then(user => {
        if (user) {
          return this._execLostPassword(user);
        } else {
          if (this.config.type == 'both') {
            return this.app.entities
              .get('user')
              .getQuery('getByUsername')
              .run(
                {
                  username: params.email
                },
                { raw: true }
              );
          } else {
            return Promise.reject(new Error('Invalid email'));
          }
        }
      })
      .then(user => {
        if (user) {
          this._execLostPassword(user);
        } else {
          return Promise.reject(new Errror('Invalid email'));
        }
      })
      .then(() => {
        return { emailSent: true };
      });
  }
}
module.exports = UserModel;
