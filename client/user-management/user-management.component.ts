import { Component, OnInit, Input, Output, EventEmitter, Inject, ViewChild, TemplateRef } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material';
import { Addon, AddonSetup } from '@materia/addons';
import { HttpClient } from '@angular/common/http';

import { md5 } from './md5';
import { SignupFormComponent } from '../signup-form/signup-form.component';

export interface User {
	email: string,
	name: string
}
@Addon({
	package: '@materia/users',
	deps: [],
	name: 'User Management',
	logo: 'https://cdn4.iconfinder.com/data/icons/business-and-management/78/Business_management_strategy_office-09-256.png',
})
@Component({
	selector: 'materia-user-management',
	templateUrl: './user-management.component.html',
	styleUrls: ['./user-management.component.scss'],
	providers: []
})
export default class UserManagementViewComponent implements OnInit {
	@Input() app;
	@Input() settings;

	@Input() baseUrl;
	@Input() apiUrl;

	@Output() openSetup = new EventEmitter<void>();

	@ViewChild(SignupFormComponent) signupDialogComp: SignupFormComponent;

	me: any;
	users: User[] = []
	nbUsers = 0;
	signupDialog: MatDialogRef<any>;

	constructor(
		@Inject('MatDialog') private dialog: MatDialog,
		@Inject('HttpClient') private http: HttpClient
	) {
	}

	ngOnInit() {
		this.init();
	}

	init() {
		this.http.post<any>(`${this.baseUrl}/entities/user/queries/list`, {}).subscribe((res) => {
			this.users = res.data.map(user =>
				Object.assign({}, user, {
					emailHash: md5(user.email)
				})
			);
			this.nbUsers = res.count;
		})

		this.http.get<any>(`${this.apiUrl}/user/me`).subscribe(res => {
			this.me = res;
		}, () => this.me = null)
	}

	openSignupDialog() {
		this.signupDialog = this.dialog.open(this.signupDialogComp.template, { panelClass: 'no-padding' });
		this.signupDialogComp.ngOnInit();
	}

	closeSignupDialog() {
		this.signupDialog.close();
	}

	signup(user) {
		console.log(user);
		this.signupDialog.close()
		this.http.post<any>(`${this.apiUrl}/user/signup`, user).subscribe(() => {
			this.init()
		})
	}

	logout() {
		this.http.post<any>(`${this.apiUrl}/user/logout`, {}).subscribe(() => {
			this.init()
		}, () => this.init())
	}
}