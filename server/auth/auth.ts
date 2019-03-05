import * as uuid from 'uuid/v4';
import * as bcrypt from 'bcryptjs';

export abstract class Auth {
  protected passport: any;
  constructor(protected app: any, protected config: any) {
    this.passport = this.app.server.passport;
  }

  protected verifyLogin(email, password, done) {
    return this.app.entities
      .get('user')
      .getQuery('getByEmail')
      .run({ email }, { raw: true })
      .then((user: any) => {
        bcrypt.compare(password, user.password).then(res => {
          if (res) {
            delete user.password;
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
      })
      .catch(e => {
        return done(null, false);
      });
  }
}
