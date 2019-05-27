export function defineConnectedUserIdPermission(app, config) {
  app.api.permissions.add({
    name: 'Connected User ID',
    description: 'Inject the id of the connected user',
    middleware: (req, res, next) => {
      if (req.user) {
        if (req.method === 'get' || req.method === 'delete') {
          req.query.id_user = req.user.id_user;
        } else {
          req.body.id_user = req.user.id_user;
        }
        return next();
      } else {
        const e: any = new Error('Unauthorized');
        e.statusCode = 401;
        throw e;
      }
    },
    readOnly: true,
    fromAddon: app.addons.get('@materia/users').toJson()
  });
}
