export function defineIsUserRolePermissions(app) {
  app.entities
    .get('user_role')
    .getQuery('list')
    .run({}, { raw: true, silent: true })
    .then(roles => {
      roles.data.forEach(row => {
        const nameCapitalized =
          row.role.substr(0, 1).toUpperCase() +
          row.role.substr(1).toLowerCase();
        app.api.permissions.add({
          name: nameCapitalized,
          description:
            'Only users associated with the role "' +
            row.role +
            '" are allowed.',
          readOnly: true,
          middleware: (req, res, next) => {
  if (req.user) {
    app.entities
    .get('user_permission')
    .getQuery('getUserRoles')
    .run({
      id_user: req.user.id_user
    })
    .then(result => {
      const roles2 = result.data;
      if (roles2.find(r => r.role === row.role)) {
      next();
      } else {
      const e: any = new Error('Unauthorized');
      e.statusCode = 401;
      throw e;
      }
    });
  } else {
    const e: any = new Error('Unauthorized');
    e.statusCode = 401;
    throw e;
  }
},
          fromAddon: app.addons.get('@materia/users').toJson()
        });
      });
    });
}
