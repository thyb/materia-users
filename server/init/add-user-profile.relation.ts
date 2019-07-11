import { App } from '@materia/server';

export function addUserProfileRelation(app: App, config) {
  const userEntity = app.entities.get('user');
  const relatedEntities = userEntity.getRelatedEntities();

  if (
    !relatedEntities.find(
      entity => entity.name === config.user_profile_entity
    )
  ) {
    const opts = {
      apply: true,
      history: false,
      save: true,
      db: true
    };
    const entityProfile = app.entities.get(
      config.user_profile_entity
    );
    if (entityProfile) {
      return entityProfile
        .addRelation(
          {
            type: 'belongsTo',
            field: 'id_user',
            unique: true,
            reference: {
              entity: 'user',
              field: 'id_user'
            }
          },
          opts
        );
    } else {
      return Promise.resolve();
    }
  }
}
