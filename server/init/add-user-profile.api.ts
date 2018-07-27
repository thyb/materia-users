export function addUserProfileApi(app, config) {
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
    const signupEndpoint = app.api.get('post', '/user/signup');
    signupEndpoint.params = [...signupEndpoint.params, ...params];
  }
}
