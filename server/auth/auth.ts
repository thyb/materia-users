import * as crypto from 'crypto';
import * as md5 from 'md5';

export abstract class Auth {
  protected passport: any;
  constructor(protected app: any, protected config: any) {
    this.passport = this.app.server.passport;
  }
  protected generateToken({
    stringBase = 'base64',
    byteLength = 32
  } = {}): Promise<string> {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(byteLength, (err, buffer) => {
        if (err) {
          reject(err);
        } else {
          resolve(buffer.toString(stringBase));
        }
      });
    });
  }

  protected verifyLogin(email, password, done) {
    return this.app.entities
      .get('user')
      .getQuery('getByEmail')
      .run({ email }, { raw: true })
      .then((user: any) => {
        const encPassword = md5(this.config.static_salt + password + user.salt);
        if (user.password === encPassword) {
          delete user.password;
          delete user.salt;
          delete user.key_email;
          delete user.key_password;
          delete user.new_email;
          if (
            this.config.user_profile_enabled &&
            this.config.user_profile_entity
          ) {
            const entityProfile = this.app.entities.get(
              this.config.user_profile_entity
            );
            if (entityProfile) {
              entityProfile
                .getQuery('getByUserId')
                .run(
                  {
                    id_user: user.id_user
                  },
                  { raw: true }
                )
                .then(userProfile => {
                  return done(null, Object.assign({}, user, userProfile));
                })
                .catch(() => {
                  return done(null, user);
                });
            } else {
              return done(null, user);
            }
          } else {
            return done(null, user);
          }
        } else {
          return done(null, false);
        }
      })
      .catch(e => {
        return done(null, false);
      });
  }
}
