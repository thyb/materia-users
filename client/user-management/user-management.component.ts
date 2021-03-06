import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ViewChild
} from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { AddonView } from '@materia/addons';
import { HttpClient } from '@angular/common/http';

import { IApp } from '@materia/interfaces';

import { SignupFormComponent } from '../signup-form/signup-form.component';
import { UserManagementSettings } from '../models/user-setting.model';

export interface User {
  email: string;
  gravatar: string;
  name: string;
  verified?: boolean;
  id_stripe?: string;
  id_user?: number;
}

@AddonView('@materia/users')
@Component({
  selector: 'materia-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss']
})
export class UserManagementViewComponent implements OnInit {
  @Input() app: IApp;
  @Input() settings: UserManagementSettings;
  @Input() baseUrl: string;
  @Input() apiUrl: string;

  @Output() openSetup = new EventEmitter<void>();
  @Output() snackbarSuccess = new EventEmitter<string>();

  @ViewChild(SignupFormComponent, { static: true }) signupDialogComp: SignupFormComponent;

  loading = true;
  me: any;
  users: User[] = [];
  nbUsers = 0;
  signupDialog: MatDialogRef<any>;
  profileFields: any[];
  displayEmailSettings: boolean;
  defaultPageIndex = 0;

  constructor(
    private dialog: MatDialog,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.refreshList();
    this.refreshConnectedUser();
    this.getProfileParams();
  }

  getProfileParams() {
    if (
      this.settings &&
      this.settings.user_profile_enabled &&
      this.settings.user_profile_entity
    ) {
      return this.http
        .get<any>(`${this.baseUrl}/infos`)
        .toPromise()
        .then(res => {
          const profileEntity = res.entities.find(
            entity => entity.name === this.settings.user_profile_entity
          );
          this.profileFields = profileEntity.fields.filter(
            field =>
              field.name !== 'id_user' &&
              (!field.primary || (field.primary && !field.autoIncrement))
          );
        })
        .catch(e => {
          this.profileFields = [];
        });
    } else {
      this.profileFields = [];
      return Promise.resolve();
    }
  }

  refreshList(params?) {
    this.loading = true;
    this.http
      .post<any>(`${this.baseUrl}/entities/user/queries/listWithGravatar`, params)
      .subscribe(res => {
        this.users = res.data;
        this.nbUsers = res.count;
        this.loading = false;
      });
  }

  refreshConnectedUser() {
    this.http.get<any>(`${this.apiUrl}/user/me`).subscribe(
      res => {
        this.me = res;
      },
      () => (this.me = null)
    );
  }

  paginationEvent(event: PageEvent) {
    this.defaultPageIndex = event.pageIndex;
    this.refreshList({limit: event.pageSize, page: event.pageIndex + 1});
  }

  configureEmails() {
    this.displayEmailSettings = true;
  }

  hideEmailSettings() {
    this.displayEmailSettings = false;
  }

  openSignupDialog() {
    this.signupDialog = this.dialog.open(this.signupDialogComp.template, {
      panelClass: 'no-padding'
    });
  }

  saveEmailSettings(settings) {
    this.http
      .post<any>(`${this.baseUrl}/addons/@materia/users/setup`, settings)
      .subscribe(() => {
        this.snackbarSuccess.emit('Settings saved!');
        this.hideEmailSettings();
        this.settings = settings;
      });
  }

  closeSignupDialog() {
    this.signupDialog.close();
  }

  signup(user) {
    this.http.post<any>(`${this.apiUrl}/user/signup`, user).subscribe(() => {
      this.closeSignupDialog();
      this.refreshList();
      this.refreshConnectedUser();
    });
  }

  logout() {
    this.http.post<any>(`${this.apiUrl}/user/logout`, {}).subscribe(
      () => {
        this.refreshConnectedUser();
      },
      () => this.refreshConnectedUser()
    );
  }

  resendVerification(id) {
    this.http.post<any>(`${this.baseUrl}/entities/user/queries/sendVerificationEmail`, {id_user: id})
    .subscribe(() => this.snackbarSuccess.emit('Verification email sent!'));
  }
}
