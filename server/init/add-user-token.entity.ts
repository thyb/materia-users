export function addUserTokenEntity(app) {
  return app.entities.add(
    {
      name: 'user_token',
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
