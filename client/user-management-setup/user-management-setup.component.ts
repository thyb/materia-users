import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import {
  FormGroup,
  FormControl,
  Validators,
  FormBuilder
} from '@angular/forms';

import { AddonSetup } from '@materia/addons';
import { HttpClient } from '@angular/common/http';

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
  @Input() app;
  @Input() settings;

  @Input() baseUrl: string;
  @Input() token: string;

  @Output() save = new EventEmitter<IBoilerplateSetup>();
  @Output('cancel') cancel: EventEmitter<any> = new EventEmitter<void>();

  loginForm: FormGroup;
  entities: any[];
  // emailForm: FormGroup;

  // accordeon = [false, false, false];
  emailAddons = [];
  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.loginForm = this.fb.group({
      method: ['session', Validators.required],
      static_salt: ['', Validators.required],
      user_profile_enabled: new FormControl(false),
      user_profile_entity: new FormControl(''),
      email_verification: new FormControl(false),
      email_addon: new FormControl('')
    });
    // this.emailForm = new FormGroup({
    //   email_signup: new FormGroup({
    //     subject: new FormControl(''),
    //     message: new FormControl(''),
    //     redirect_url: new FormControl('')
    //   }),
    //   email_lost_password: new FormGroup({
    //     subject: new FormControl(''),
    //     message: new FormControl(''),
    //     redirect_url: new FormControl('')
    //   }),
    //   email_change_email: new FormGroup({
    //     subject: new FormControl(''),
    //     message: new FormControl(''),
    //     redirect_url: new FormControl('')
    //   })
    // });
  }

  ngOnInit() {
    this.http
      .get<any>(this.baseUrl + '/infos')
      .toPromise()
      .then(res => {
        this.entities = res.entities.filter(entity => !entity.fromAddon);
        this.emailAddons = res.addons.filter(
          addon =>
            addon.package === '@materia/sendgrid' ||
            addon.package === '@materia/mailjet'
        );
        if (this.emailAddons.length > 0) {
          this.loginForm
            .get('email_addon')
            .setValue(
              (this.settings && this.settings.email_addon) ||
                this.emailAddons[0].package
            );
          this.loginForm
            .get('email_verification')
            .setValue(
              (this.settings && this.settings.email_verification) || false
            );
        } else {
          this.loginForm.get('email_verification').disable();
          this.loginForm.get('email_verification').setValue(false);
          this.loginForm.get('email_addon').disable();
        }
        if (this.entities.length > 0) {
          this.loginForm
            .get('user_profile_entity')
            .setValue(
              (this.settings && this.settings.user_profile_entity) ||
                this.entities[0].name
            );
          this.loginForm
            .get('user_profile_enabled')
            .setValue(
              (this.settings && this.settings.user_profile_enabled) || false
            );
        } else {
          this.loginForm.get('user_profile_enabled').setValue(false);
          this.loginForm.get('user_profile_entity').setValue('');
          this.loginForm.get('user_profile_enabled').disable();
          this.loginForm.get('user_profile_entity').disable();
        }
        if (!this.settings || !this.settings.email_verification) {
          this.loginForm.get('email_addon').disable();
        }
        if (this.settings && this.settings.method) {
          this.loginForm.get('method').setValue(this.settings.method);
        }
        this.loginForm
          .get('static_salt')
          .setValue((this.settings && this.settings.static_salt) || '');
      });

    // if (this.settings.email_signup) {
    //   this.emailForm.controls.email_signup.setValue(
    //     this.settings.email_signup
    //   );
    // }
    // if (this.settings.email_change_email) {
    //   this.emailForm.controls.email_change_email.setValue(
    //     this.settings.email_change_email
    //   );
    // }
    // if (this.settings.email_lost_password) {
    //   this.emailForm.controls.email_lost_password.setValue(
    //     this.settings.email_lost_password
    //   );
    // }
    // if (this.settings.email_action) {
    //   this.loginForm.controls.entity.setValue(
    //     this.settings.email_action.entity
    //   );
    //   this.loginForm.controls.query.setValue(
    //     this.settings.email_action.query
    //   );
    //   this.getQueries(this.settings.email_action.entity);
    // }
    this.loginForm.get('user_profile_enabled').valueChanges.subscribe(val => {
      if (val) {
        this.loginForm.get('user_profile_entity').enable();
      } else {
        this.loginForm.get('user_profile_entity').disable();
      }
    });

    this.loginForm.get('email_verification').valueChanges.subscribe(val => {
      if (val) {
        this.loginForm.get('email_addon').enable();
        // let c = this.emailForm.controls.email_signup['controls'];
        // c.message.enable();
        // c.subject.enable();
        // c.redirect_url.enable();
        // c = this.emailForm.controls.email_lost_password['controls'];
        // c.message.enable();
        // c.subject.enable();
        // c.redirect_url.enable();
        // c = this.emailForm.controls.email_change_email['controls'];
        // c.message.enable();
        // c.subject.enable();
        // c.redirect_url.enable();
      } else {
        this.loginForm.get('email_addon').disable();
        // let c = this.emailForm.controls.email_signup['controls'];
        // c.message.disable();
        // c.subject.disable();
        // c.redirect_url.disable();
        // c = this.emailForm.controls.email_lost_password['controls'];
        // c.message.disable();
        // c.subject.disable();
        // c.redirect_url.disable();
        // c = this.emailForm.controls.email_change_email['controls'];
        // c.message.disable();
        // c.subject.disable();
        // c.redirect_url.disable();
      }
    });
  }

  // getQueries(entityName) {
  //   if (entityName) {
  //     const entity = this.entities.find(e => e.name === entityName);
  //     this.queries = entity.queries;
  //     if (entity.name === 'sendgrid' || entity.name === 'mailjet') {
  //       this.loginForm.get('query').setValue('send');
  //     }
  //   } else {
  //     this.queries = [];
  //   }
  // }

  saveClick() {
    const config = { name: '@materia/users' };
    this.save.emit(config);
  }

  finish() {
    const setupConfig = Object.assign({}, this.loginForm.value);
    // , {
    //   email_signup: this.emailForm.controls.email_signup.value,
    //   email_lost_password: this.emailForm.controls.email_lost_password.value,
    //   email_change_email: this.emailForm.controls.email_change_email.value
    // }

    console.log(setupConfig);
    this.save.emit(setupConfig);
  }

  close() {
    this.cancel.emit();
  }
}
