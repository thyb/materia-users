export function addUserProfileQueries(app, config) {
  const entityProfile = app.entities.get(config.user_profile_entity);
  if (entityProfile) {
    const profileFields = entityProfile.fields.filter(
      field => !field.primary && field.name !== 'id_user'
    );
    const params = profileFields.map(field => {
      return {
        name: field.name,
        type: field.type,
        component: field.component,
        required: field.required
      };
    });
    const signupQuery = app.entities.get('user').getQuery('signup');
    signupQuery.params = [...signupQuery.params, ...params];
    return entityProfile.addQuery({
      id: 'getByUserId',
      type: 'findOne',
      opts: {
        params: [
          {
            name: 'id_user',
            type: 'number',
            required: true
          }
        ],
        conditions: [
          {
            name: 'id_user',
            operator: '=',
            value: '='
          }
        ]
      }
    });
  }
}
