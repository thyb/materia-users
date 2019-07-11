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

  @Output() saveAndRestart = new EventEmitter<UserManagementSettings>();
  @Output() cancel = new EventEmitter<void>();

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

  finish() {
    if (this.loginForm.valid) {
      this.saveAndRestart.emit(this.loginForm.value);
    }
  }

  close() {
    this.cancel.emit();
  }
}
