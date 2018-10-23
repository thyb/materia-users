export function addUserTokenQueries(app) {
  return app.entities.get('user_token').loadQueries([
    {
      id: 'clearExpiredTokens',
      type: 'custom',
      opts: {
        params: [],
        action: 'clearExpiredTokens'
      }
    },
    {
      id: 'getActiveTokens',
      type: 'custom',
      opts: {
        params: [
          {
            name: 'id_user',
            type: 'text',
            required: true
          }
        ],
        action: 'getActiveTokens'
      }
    }
  ]);
}
