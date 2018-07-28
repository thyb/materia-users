export function addUserTokenQueries(app) {
  return app.entities.get('user_token').loadQueries([
    {
      id: 'clearExpiredTokens',
      type: 'custom',
      opts: {
        params: [],
        action: 'clearExpiredTokens'
      }
    }
  ]);
}
