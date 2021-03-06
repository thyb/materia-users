import { App } from '@materia/server';

import { TokenAuth } from './auth/token';
import { SessionAuth } from './auth/session';
import { Auth } from './auth/auth';
import { defineConnectedUserIdPermission } from './permissions/connected-user-id';
import { defineAuthenticatedPermission } from './permissions/authenticated';
import { defineIsUserRolePermissions } from './permissions/is-user-role';
import { addUserTokenEntity } from './init/add-user-token.entity';
import { addUserProfileRelation } from './init/add-user-profile.relation';
import { addUserProfileQueries } from './init/add-user-profile.queries';
import { addUserProfileApi } from './init/add-user-profile.api';
import { addUserTokenQueries } from './init/add-user-token.queries';
import { addSocialAccountEntity } from './init/add-social-account.entity';
import { addSocialAccountQueries } from './init/add-social-account.queries';

export default class UserManagementAddon {
  public static displayName = 'User Management';
  public static logo =
    'https://materiahq.github.io/materia-website-content/logo/addons/users.png';

  public static installSettings = false;

  signupParams: any[];
  options: { history: boolean; save: boolean; db: boolean };
  disabled: boolean;

  auth: Auth;

  constructor(private app: App, private config: any) {}

  afterLoadEntities() {
    if (this.app.database.disabled) {
      this.disabled = true;
      return Promise.resolve();
    }
    if (this.config) {
      const promises = [];
      if (this.config.method === 'token') {
        promises.push(addUserTokenEntity(this.app));
      }

      promises.push(addSocialAccountEntity(this.app));

      return Promise.all(promises);
    }
    return Promise.resolve();
  }

  afterLoadQueries() {
    let promise = Promise.resolve();
    if (! this.disabled && this.config.user_profile_enabled && this.config.user_profile_entity) {
      promise = promise.then(() => addUserProfileRelation(this.app, this.config));
    }
    if (! this.disabled && this.config.user_profile_enabled && this.config.user_profile_entity) {
      promise = promise.then(() => addUserProfileQueries(this.app, this.config));
    }
    if (! this.disabled && this.config.method === 'token') {
      promise = promise.then(() => addUserTokenQueries(this.app));
    }
    if (! this.disabled) {
      return promise.then(() => addSocialAccountQueries(this.app));
    } else {
      return promise;
    }
  }

  afterLoadAPI() {
    if (! this.disabled && this.config.user_profile_enabled && this.config.user_profile_entity) {
      return addUserProfileApi(this.app, this.config);
    }
    return Promise.resolve();
  }

  start() {
    if (this.disabled) {
      return Promise.resolve();
    }

    defineAuthenticatedPermission(this.app, this.config);
    defineConnectedUserIdPermission(this.app, this.config);

    if (this.config && this.config.method === 'token') {
      this.auth = new TokenAuth(this.app, this.config);
    } else {
      this.auth = new SessionAuth(this.app, this.config);
    }

    defineIsUserRolePermissions(this.app);
  }

  uninstall(app) {}
}
