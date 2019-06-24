import * as crypto from 'crypto';
import * as oauth2orize from 'oauth2orize';
import * as uuid from 'uuid/v4';

import { Strategy as ClientPasswordStrategy } from 'passport-oauth2-client-password';
import { Strategy as BearerStrategy } from 'passport-http-bearer';
import { Auth } from './auth';

export class TokenAuth extends Auth {

  constructor(app: any, config: any) {
    super(app, config);
    this.app.usersOAuthServer = oauth2orize.createServer();
    this.app.usersOAuthServer.exchange(
      oauth2orize.exchange.clientCredentials((client, res, done) => {
        const token = uuid();
        const tokenHash = crypto
          .createHash('sha1')
          .update(token)
          .digest('hex');
        this.app.entities
          .get('user_token')
          .getQuery('create')
          .run({
            token: tokenHash,
            expires_in: new Date(new Date().getTime() + 3600 * 48 * 1000),
            id_user: client.id_user,
            scope: '["*"]'
          });
        return done(
          null /* No error*/,
          token /* The generated token*/,
          null /* The generated refresh token, none in this case */,
          client /* Additional properties to be merged with the token and send in the response */
        );
      })
    );
    this.passport.use(
      'usersClientPassword',
      new ClientPasswordStrategy(this.verifyLogin.bind(this))
    );
    this.passport.use(
      'usersAccessToken',
      new BearerStrategy(this.verifyToken.bind(this))
    );
  }

  verifyToken(accessToken, done) {
    if ( ! accessToken ) {
      return done(null, false);
    }
    const accessTokenHash = crypto
      .createHash('sha1')
      .update(accessToken)
      .digest('hex');

    this.app.entities
      .get('user_token')
      .getQuery('get')
      .run(
        {
          token: accessTokenHash
        },
        { raw: true }
      )
      .then(token => {
        if ( ! token) {
          return done(null, false);
        } else if (new Date() > token.expires_in) {
          this.clearExpiredTokens();
          done(null, false);
        } else {
          const info = { scope: '*' };
          done(null, { id_user: token.id_user }, info);
        }
      })
      .catch(err => {
        return done(null, false);
      });
  }

  clearExpiredTokens() {
    this.app.entities
      .get('user_token')
      .getQuery('clearExpiredTokens')
      .run();
  }
}
