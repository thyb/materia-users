export function defineAuthenticatedPermission(app, config) {
  app.api.permissions.add({
    name: 'Authenticated',
    description: 'Only signed in users are allowed',
    middleware: (req, res, next) => {
      if (config.method === 'token') {
        return app.server.passport.authenticate('usersAccessToken', {
          session: false
        })(req, res, next);
      } else {
        if (req.user) {
          return next();
        }
        const e: any = new Error('Unauthorized');
        e.statusCode = 401;
        throw e;
      }
    },
    readOnly: true,
    exports: {
      // Not used yet but could be used for injecting param in endpoint builder.
      'me.id_user': 'user.id_user', // req.user.id_user
      'me.email': 'user.email', // req.user.email etc.
      'me.name': 'user.name'
      // TODO: add other user fields here
    }
  });
}
