import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ViewChild
} from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material';
import { AddonView } from '@materia/addons';
import { HttpClient } from '@angular/common/http';

import md5 from 'md5';
import { SignupFormComponent } from '../signup-form/signup-form.component';

export interface User {
  email: string;
  emailHash: string;
  name: string;
}
@AddonView('@materia/users')
@Component({
  selector: 'materia-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss'],
  providers: []
})
export class UserManagementViewComponent implements OnInit {
  @Input() app;
  @Input() settings;

  @Input() baseUrl;
  @Input() apiUrl;

  @Output() openSetup = new EventEmitter<void>();

  @ViewChild(SignupFormComponent) signupDialogComp: SignupFormComponent;

  me: any;
  users: User[] = [];
  nbUsers = 0;
  signupDialog: MatDialogRef<any>;

  constructor(private dialog: MatDialog, private http: HttpClient) {}

  ngOnInit() {
    this.refreshList();
    this.refreshConnectedUser();
  }

  refreshList() {
    this.http
      .post<any>(`${this.baseUrl}/entities/user/queries/list`, {})
      .subscribe(res => {
        console.log(res.data);
        this.users = res.data.map(user => {
          console.log('user', user);
          return Object.assign({}, user, {
            emailHash: md5(user.email || 'aaa')
          });
        });
        this.nbUsers = res.count;
      });
  }

  refreshConnectedUser() {
    this.http.get<any>(`${this.apiUrl}/user/me`).subscribe(res => {
      this.me = res;
    }, () => (this.me = null));
  }

  openSignupDialog() {
    this.signupDialog = this.dialog.open(this.signupDialogComp.template, {
      panelClass: 'no-padding'
    });
  }

  closeSignupDialog() {
    this.signupDialog.close();
  }

  signup(user) {
    console.log(user);
    this.http.post<any>(`${this.apiUrl}/user/signup`, user).subscribe(() => {
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
}
