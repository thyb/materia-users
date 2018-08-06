export function addSocialAccountEntity(app) {
  const addonsEntitiesPositions = app.addons.addonsConfig.entities || {};
  let x, y;
  if (
    addonsEntitiesPositions &&
    addonsEntitiesPositions.social_account &&
    addonsEntitiesPositions.social_account.x
  ) {
    x = addonsEntitiesPositions.social_account.x;
    y = addonsEntitiesPositions.social_account.y;
  }

  return app.entities.add(
    {
      name: 'social_account',
      x: x,
      y: y,
      fields: [
        {
          name: 'id_social_account',
          type: 'number',
          primary: true,
          required: true,
          unique: true,
          autoIncrement: true
        },
        {
          name: 'social_user_id',
          type: 'text',
          required: true
        },
        {
          name: 'provider',
          type: 'text',
          required: true
        },
        {
          name: 'access_token',
          type: 'text',
          required: true
        },
        {
          name: 'refresh_token',
          type: 'text',
          required: false
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
