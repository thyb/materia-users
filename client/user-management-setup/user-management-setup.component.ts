import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';

import { AddonSetup } from '@materia/addons';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface IBoilerplateSetup {
  name: string;
}

@AddonSetup('@materia/users')
@Component({
  selector: 'materia-user-management-setup',
  templateUrl: './user-management-setup.component.html',
  styleUrls: ['./user-management-setup.component.scss'],
  providers: [FormBuilder]
})
export class UserManagementSetupComponent implements OnInit {
  @Input()
  app;
  @Input()
  settings;

  @Input()
  baseUrl: string;

  @Input()
  token: string;

  @Output()
  save = new EventEmitter<IBoilerplateSetup>();
  @Output('cancel')
  cancel: EventEmitter<any> = new EventEmitter<void>();

  loginForm: FormGroup;
  entities: any[];

  templates: any;
  emailAddons = [];

  constructor(private fb: FormBuilder, private http: HttpClient) {}

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
          static_salt: [
            this.getSettingsProperty('static_salt', ''),
            Validators.required
          ],
          user_profile_enabled: [
            this.getSettingsProperty('user_profile_enabled', 'false')
          ],
          user_profile_entity: [
            this.getSettingsProperty('user_profile_entity', '')
          ],
          email_verification: [
            this.getSettingsProperty('email_verification', false)
          ],
          email_addon: [this.getSettingsProperty('email_addon', false)],
          template_signup: [this.getSettingsProperty('template_signup', '')],
          redirect_signup: [this.getSettingsProperty('redirect_signup', '')],
          subject_signup: [this.getSettingsProperty('subject_signup', '')],
          subject_lost_password: [
            this.getSettingsProperty('subject_lost_password', '')
          ],
          subject_change_email: [
            this.getSettingsProperty('subject_change_email', '')
          ],
          template_lost_password: [
            this.getSettingsProperty('template_lost_password', '')
          ],
          redirect_lost_password: [
            this.getSettingsProperty('redirect_lost_password', '')
          ],
          template_change_email: [
            this.getSettingsProperty('template_change_email', '')
          ],
          redirect_change_email: [
            this.getSettingsProperty('redirect_change_email', '')
          ]
        });
        this.entities = res.entities.filter(entity => !entity.fromAddon);
        this.emailAddons = res.addons.filter(
          addon =>
            addon.package === '@materia/sendgrid' ||
            addon.package === '@materia/mailjet'
        );

        if (this.emailAddons.length === 0) {
          this.loginForm.get('email_verification').disable();
          this.loginForm.get('email_addon').disable();
        }

        if (!this.settings || !this.settings.email_verification) {
          this.loginForm.get('email_addon').disable();
        }
        if (this.entities.length === 0) {
          this.loginForm.get('user_profile_enabled').setValue(false);
          this.loginForm.get('user_profile_entity').setValue('');
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

  saveClick() {
    const config = { name: '@materia/users' };
    this.save.emit(config);
  }

  finish() {
    if (this.loginForm.valid) {
      this.save.emit(this.loginForm.value);
    }
  }

  close() {
    this.cancel.emit();
  }
}
