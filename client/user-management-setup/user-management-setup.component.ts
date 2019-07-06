import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AddonSetup } from '@materia/addons';
import { IApp, IEntity } from '@materia/interfaces';
import { map, filter, take } from 'rxjs/operators';
import { ActionsSubject } from '@ngrx/store';

import { UserManagementSettings } from '../models/user-setting.model';

@AddonSetup('@materia/users')
@Component({
  selector: 'materia-user-management-setup',
  templateUrl: './user-management-setup.component.html',
  styleUrls: ['./user-management-setup.component.scss']
})
export class UserManagementSetupComponent implements OnInit {
  @Input() app: IApp;
  @Input() settings: UserManagementSettings;
  @Input() baseUrl: string;
  @Input() token: string;

  @Output() save = new EventEmitter<UserManagementSettings>();
  @Output() cancel = new EventEmitter<void>();
  @Output() dispatch = new EventEmitter<any>();

  loginForm: FormGroup;
  entities: IEntity[];
  emailAddons = [];

  constructor(private fb: FormBuilder, private http: HttpClient, private dispatcher: ActionsSubject) {}

  private getSettingsProperty(property, defaultValue) {
    return (this.settings && this.settings[property]) || defaultValue;
  }

  ngOnInit() {
    this.http
      .get<any>(this.baseUrl + '/infos')
      .toPromise()
      .then(res => {
        this.loginForm = this.fb.group({
          method: [
            this.getSettingsProperty('method', 'session'),
            Validators.required
          ],
          user_profile_enabled: [
            this.getSettingsProperty('user_profile_enabled', false)
          ],
          user_profile_entity: [
            this.getSettingsProperty('user_profile_entity', null)
          ],
          email_verification: [
            this.getSettingsProperty('email_verification', false)
          ],
          email_addon: [this.getSettingsProperty('email_addon', false)],
        });
        this.entities = res.entities.filter((entity: IEntity) => ! entity.fromAddon);
        this.emailAddons = res.addons.filter(
          addon =>
            addon.package === '@materia/sendgrid' ||
            addon.package === '@materia/mailjet'
        );

        if (this.emailAddons.length === 0) {
          this.loginForm.get('email_verification').disable();
          this.loginForm.get('email_addon').disable();
        }

        if ( ! this.settings || ! this.settings.email_verification) {
          this.loginForm.get('email_addon').disable();
        }

        if ( ! this.settings || ! this.settings.user_profile_enabled) {
          this.loginForm.get('user_profile_entity').disable();
        }

        if (this.entities.length === 0) {
          this.loginForm.get('user_profile_enabled').setValue(false);
          this.loginForm.get('user_profile_entity').setValue(null);
          this.loginForm.get('user_profile_enabled').disable();
          this.loginForm.get('user_profile_entity').disable();
        }
        this.loginForm
          .get('user_profile_enabled')
          .valueChanges.subscribe(val => {
            if (val) {
              this.loginForm.get('user_profile_entity').enable();
            } else {
              this.loginForm.get('user_profile_entity').disable();
            }
          });

        this.loginForm.get('email_verification').valueChanges.subscribe(val => {
          if (val) {
            this.loginForm.get('email_addon').enable();
          } else {
            this.loginForm.get('email_addon').disable();
          }
        });
      });
  }

  async finish() {
    if (this.loginForm.valid) {
      const newSettings = this.loginForm.value;
      if (
          (this.settings && this.settings.user_profile_enabled !== newSettings.user_profile_enabled) ||
          (! this.settings && newSettings.user_profile_enabled)) {
            if (newSettings.user_profile_enabled) {
              await this.addUserProfileRelationship(newSettings);
              await this.addUserProfileQuery(newSettings);
              const entities: IEntity[] = await this.http.get<any>(`${this.baseUrl}/entities`).pipe(
                map((res: any) => res.entities)
            ).toPromise();
            const userProfileEntity: IEntity = entities.find(e => e.name === newSettings.user_profile_entity);
            const userProfileFields = userProfileEntity.fields.filter(f => ! f.primary && f.name !== 'id_user');
              await this.addUserProfileParams(newSettings, userProfileFields);
              await this.addUserProfileApiParams(newSettings, userProfileFields);
            } else {
              await this.removeUserProfileQuery();
              await this.removeUserProfileRelationship();
              await this.removeUserProfileParams();
              await this.removeUserProfileApiParams();
            }
      }
      this.save.emit(this.loginForm.value);
    }
  }

  async addUserProfileRelationship(settings) {
    this.dispatch.emit({
      type: 'RELATION_SAVE',
      payload: {
        rel1: {
          type: 'belongsTo',
          field: 'id_user',
          reference: {
            entity: 'user',
            field: 'id_user'
          }
        },
        rel2: {
          type: 'hasOne',
          reference: {
            entity: settings.user_profile_entity,
            field: 'id_user'
          }
        }
      }
    });
    return this.dispatcher.pipe(
      filter(action => action.type === 'RELATION_SAVE_SUCCESS'),
      take(1)
    ).toPromise();
  }

  addUserProfileQuery(settings) {
    this.dispatch.emit(
      { type: 'QUERY_ADD',
        payload: {
          entity: settings.user_profile_entity,
          query:       {
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
          }
        }
      }
    );
    return this.dispatcher.pipe(
      filter(action => action.type === 'QUERY_ADD_SUCCESS'),
      take(1)
    ).toPromise();
  }

  async addUserProfileApiParams(settings, fields) {
    const userProfileParams = fields.map((field) => (
      {
        name: field.name,
        type: field.type,
        component: field.component,
        required: field.required
      }
    ));
    return this.dispatch.emit({
      type: 'ENDPOINT_UPDATE_PARAMS',
      payload: {
        method: 'post',
        url: '/user/signup',
        params: [
          {
            'name': 'email',
            'required': true,
            'type': 'text',
            'component': 'email'
          },
          {
            'name': 'password',
            'required': true,
            'type': 'text',
            'component': 'password'
          },
          ...userProfileParams
        ]
      }
    });
  }

  async addUserProfileParams(settings, fields) {
    const userProfileParams = fields.map((field) => (
      {
        name: field.name,
        type: field.type,
        component: field.component,
        required: field.required
      }
    ));
    return this.dispatch.emit({
      type: 'QUERY_UPDATE_PARAMS',
      payload: {
        entity: 'user',
        query: 'signup',
        params: [
          {
            'name': 'email',
            'required': true,
            'type': 'text',
            'component': 'email'
          },
          {
            'name': 'password',
            'required': true,
            'type': 'text',
            'component': 'password'
          },
          ...userProfileParams
        ]
      }
    });
  }

  removeUserProfileParams() {
    return this.dispatch.emit({
      type: 'QUERY_UPDATE_PARAMS',
      payload: {
        entity: 'user',
        query: 'signup',
        params: [
          {
            'name': 'email',
            'required': true,
            'type': 'text',
            'component': 'email'
          },
          {
            'name': 'password',
            'required': true,
            'type': 'text',
            'component': 'password'
          }
        ]
      }
    });
  }

  removeUserProfileApiParams() {
    return this.dispatch.emit({
      type: 'ENDPOINT_UPDATE_PARAMS',
      payload: {
        method: 'post',
        url: '/user/signup',
        params: [
          {
            'name': 'email',
            'required': true,
            'type': 'text',
            'component': 'email'
          },
          {
            'name': 'password',
            'required': true,
            'type': 'text',
            'component': 'password'
          }
        ]
      }
    });
  }

  removeUserProfileRelationship() {
    this.dispatch.emit({
      type: 'RELATION_REMOVE',
      payload: {
        entity: this.settings.user_profile_entity,
        relation: {
          type: 'belongsTo',
          field: 'id_user',
          reference: {
            field: 'id_user',
            entity: 'user'
          }
        }
      }
    });
    return this.dispatcher.pipe(
      filter(action => action.type === 'RELATION_REMOVE_SUCCESS'),
      take(1)
    ).toPromise();
  }

  removeUserProfileQuery() {
    this.dispatch.emit(
      { type: 'QUERY_DELETE',
        payload: {
          entity: this.settings.user_profile_entity,
          query: 'getByUserId'
        }
      }
    );
    return this.dispatcher.pipe(
      filter(action => action.type === 'QUERY_DELETE_SUCCESS'),
      take(1)
    ).toPromise();
  }

  close() {
    this.cancel.emit();
  }
}
