import { Auth } from './auth';
import { Strategy as LocalStrategy } from 'passport-local';

export class SessionAuth extends Auth {

  constructor(app: any, config: any) {
    super(app, config);
    this.passport.use(
      new LocalStrategy(
        {
          usernameField: 'email',
          passwordField: 'password'
        },
        this.verifyLogin.bind(this)
      )
    );

    this.passport.serializeUser(function(user, done) {
      done(null, user.id_user);
    });

    this.passport.deserializeUser((id_user, done) => {
      this.app.entities
        .get('user')
        .getQuery('get')
        .run({ id_user: id_user }, { raw: true })
        .then(user => {
          delete user.password;
          delete user.key_password;
          delete user.key_email;
          done(null, user);
        })
        .catch(err => {
          done(err);
        });
    });
  }
}
