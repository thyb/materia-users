export function addSocialAccountQueries(app) {
  return app.entities.get('social_account').loadQueries([
    {
      id: 'find',
      type: 'custom',
      opts: {
        action: 'find',
        params: [
          {
            name: 'provider',
            type: 'text',
            required: true
          },
          {
            name: 'social_user_id',
            type: 'text',
            required: true
          }
        ]
      }
    }
  ]);
}
