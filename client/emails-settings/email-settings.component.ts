import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ViewChild
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatExpansionPanel } from '@angular/material/expansion';

import { UserManagementSettings } from 'client/models/user-setting.model';

@Component({
  selector: 'materia-user-management-email-settings',
  templateUrl: './email-settings.component.html',
  styleUrls: ['./email-settings.component.scss']
})
export class EmailSettingsComponent implements OnInit {
  @Input() settings: UserManagementSettings;
  @Input() baseUrl: string;

  @Output() hide = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  @ViewChild('signupPanel', { static: true }) signupPanel: MatExpansionPanel;
  @ViewChild('changeEmailPanel', { static: true }) changeEmailPanel: MatExpansionPanel;
  @ViewChild('lostPasswordPanel', { static: true }) lostPasswordPanel: MatExpansionPanel;

  emailForm: FormGroup;
  templates: Array<{ name: string; id: number }>;

  constructor(private http: HttpClient, private form: FormBuilder) {}

  ngOnInit(): void {
    this.emailForm = this.form.group({
      method: [
        this.getSettingsProperty('method', 'session'),
        Validators.required
      ],
      user_profile_enabled: [
        this.getSettingsProperty('user_profile_enabled', false)
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
      subject_lost_password: [this.getSettingsProperty('subject_lost_password', '')],
      subject_change_email: [this.getSettingsProperty('subject_change_email', '')],
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

    this.refreshTemplates();
  }

  refreshTemplates() {
    if (this.settings.email_addon === '@materia/mailjet') {
      this.http
        .post<any>(`${this.baseUrl}/entities/mailjet_template/queries/list`, {limit: 1000})
        .subscribe(data => {
          this.templates = data.data
            .filter(row => row.OwnerId !== 0)
            .map(row => {
              return {
                name: row.Name,
                id: row.ID
              };
            });
        });
    } else if (this.settings.email_addon === '@materia/sendgrid') {
      this.http
        .post<any>(
          `${this.baseUrl}/entities/sendgrid_template/queries/listTemplates`,
          {}
        )
        .subscribe(data => {
          this.templates = data && data.data && data.data;
          // TODO...
        });
    }
  }

  saveEmailSettings() {
    if (this.emailForm.valid) {
      this.save.emit(this.emailForm.value);
    }
  }

  cancel() {
    this.hide.emit();
  }

  private getSettingsProperty(property, defaultValue) {
    return (this.settings && this.settings[property]) || defaultValue;
  }
}
