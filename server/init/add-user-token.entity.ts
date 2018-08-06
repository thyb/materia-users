export function addUserTokenEntity(app) {
  const addonsEntitiesPositions = app.addons.addonsConfig.entities || {};
  let x, y;
  if (addonsEntitiesPositions && addonsEntitiesPositions.user_token && addonsEntitiesPositions.user_token.x) {
    x = addonsEntitiesPositions.user_token.x;
    y = addonsEntitiesPositions.user_token.y;
  }

  return app.entities.add(
    {
      name: 'user_token',
      x: x,
      y: y,
      fields: [
        {
          name: 'token',
          type: 'string',
          required: true,
          primary: true,
          unique: true
        },
        {
          name: 'expires_in',
          type: 'date',
          required: true
        },
        {
          name: 'scope',
          type: 'string',
          required: true
        }
      ],
      relations: [
        {
          type: 'belongsTo',
          field: 'id_user',
          reference: {
            entity: 'user',
            field: 'id_user'
          }
        }
      ]
    },
    {
      fromAddon: app.addons.get('@materia/users'),
      apply: true,
      history: true,
      save: false,
      db: true
    }
  );
}
