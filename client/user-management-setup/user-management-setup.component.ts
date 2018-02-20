
import { Component, OnInit, Input, Output, EventEmitter, Inject, InjectionToken, NgZone, Optional, SkipSelf } from "@angular/core";
import { FormGroup, FormControl, Validators, FormBuilder } from "@angular/forms";
import { MatSnackBar } from "@angular/material";
import { OVERLAY_PROVIDERS } from "@angular/cdk/overlay"

import { AddonSetup } from "@materia/addons";
import { Overlay, OverlayPositionBuilder, ScrollStrategyOptions } from "@angular/cdk/overlay";
import { VIEWPORT_RULER_PROVIDER } from "@angular/cdk/scrolling";
import { ScrollDispatcher, SCROLL_DISPATCHER_PROVIDER } from "@angular/cdk/scrolling";
import { Platform } from "@angular/cdk/platform";
import { SCROLL_DISPATCHER_PROVIDER_FACTORY } from "@angular/cdk/scrolling";

export interface IBoilerplateSetup {
	name: string;
}

@AddonSetup({
	package: "@materia/users",
	name: "UserManagementSetup",
	deps: []
})
@Component({
	selector: "materia-user-management-setup",
	templateUrl: "./user-management-setup.component.html",
	styleUrls: ["./user-management-setup.component.scss"],
	providers: [FormBuilder, MatSnackBar]
	/*{
	// If there is already a ScrollDispatcher available, use that. Otherwise, provide a new one.
	provide: ScrollDispatcher,
	deps: [[new Optional(), new SkipSelf(), ScrollDispatcher], NgZone, Platform],
	useFactory: SCROLL_DISPATCHER_PROVIDER_FACTORY
}, ScrollStrategyOptions, Overlay]*/
})
export default class UserManagementSetupComponent implements OnInit {
	fields: ({ name: string; type: string; readonly: boolean; unique: boolean; required: boolean; } | { name: string; type: string; readonly: boolean; required: boolean; unique?: undefined; })[];
	@Input() app;
	@Input() settings;

	@Output() save = new EventEmitter<IBoilerplateSetup>();
	@Output("cancel") cancel: EventEmitter<any> = new EventEmitter<void>();

	loginForm: FormGroup;
	emailForm: FormGroup;
	userForm: FormGroup;
	queries = [];
	accordeon = [false, false, false];

	constructor(private fb: FormBuilder) {
		this.fields = [
			{ name: "username", type: "text", readonly: true, unique: true, required: true },
			{ name: "password", type: "text", readonly: true, required: true }
		]
		this.loginForm = this.fb.group({
			type: ["", Validators.required],
			static_salt: ["", Validators.required]
		});
		this.emailForm = new FormGroup({
			email_verification: new FormControl(""),
			entity: new FormControl(""),
			query: new FormControl(""),
			email_signup: new FormGroup({
				subject: new FormControl(""),
				message: new FormControl(""),
				redirect_url: new FormControl("")
			}),
			email_lost_password: new FormGroup({
				subject: new FormControl(""),
				message: new FormControl(""),
				redirect_url: new FormControl("")
			}),
			email_change_email: new FormGroup({
				subject: new FormControl(""),
				message: new FormControl(""),
				redirect_url: new FormControl("")
			})
		});
		this.userForm = new FormGroup({
			fields: new FormControl(
				this.fields,
				[Validators.required]
			)
		});
	}

	ngOnInit() {
		if (!this.settings) {
			this.loginForm.controls.type.setValue("username");
			this.emailForm.controls.email_verification.disable();
		} else {
			this.loginForm.controls.type.setValue(this.settings.type);
			this.loginForm.controls.static_salt.setValue(this.settings.static_salt);
			if (this.settings.fields) {
				this.settings.fields.forEach(f => {
					if (f.name == "email" || f.name == "username" || f.name == "password") {
						f.readonly = true;
					}
				})
				this.userForm.controls.fields.setValue(this.settings.fields);
			}
			if (this.settings.type == "both" || this.settings.type == "email") {
				this.emailForm.controls.email_verification.setValue(this.settings.email_verification);
				if (this.settings.email_signup) {
					this.emailForm.controls.email_signup.setValue(this.settings.email_signup);
				}
				if (this.settings.email_change_email) {
					this.emailForm.controls.email_change_email.setValue(this.settings.email_change_email);
				}
				if (this.settings.email_lost_password) {
					this.emailForm.controls.email_lost_password.setValue(this.settings.email_lost_password);
				}
				if (this.settings.email_action) {
					this.emailForm.controls.entity.setValue(this.settings.email_action.entity);
					this.emailForm.controls.query.setValue(this.settings.email_action.query);
					this.getQueries(this.settings.email_action.entity);
				}
			}
		}
		this.loginForm.controls.type.valueChanges.subscribe(val => {
			switch (val) {
				case "username":
					this.emailForm.controls.email_verification.setValue(false);
					this.emailForm.controls.email_verification.disable();
					this.fields = [
						{ name: "username", type: "text", readonly: true, unique: true, required: true },
						{ name: "password", type: "text", readonly: true, required: true }
					]
					break;
				case "email":
					this.emailForm.controls.email_verification.enable();
					this.fields = [
						{ name: "email", type: "text", readonly: true, unique: true, required: true },
						{ name: "password", type: "text", readonly: true, required: true }
					]
					break;
				case "both":
					this.emailForm.controls.email_verification.enable();
					this.fields = [
						{ name: "email", type: "text", readonly: true, unique: true, required: true },
						{ name: "username", type: "text", readonly: true, unique: true, required: true },
						{ name: "password", type: "text", readonly: true, required: true }
					]
					break;
				default:
					this.fields = [
						{ name: "username", type: "text", readonly: true, unique: true, required: true },
						{ name: "password", type: "text", readonly: true, required: true }
					]
			}
			this.userForm.controls.fields.setValue(this.fields);
		});
		this.emailForm.controls.entity.valueChanges.subscribe(val => {
			if (val) {
				const ent = this.app.entities.get(val);
				this.queries = ent.getQueries();
			} else {
				this.queries = [];
			}
		});
		this.emailForm.controls.email_verification.valueChanges.subscribe(val => {
			if (val) {
				this.emailForm.controls.entity.enable();
				this.emailForm.controls.query.enable();
				let c = this.emailForm.controls.email_signup["controls"]
				c.message.enable()
				c.subject.enable()
				c.redirect_url.enable()
				c = this.emailForm.controls.email_lost_password["controls"]
				c.message.enable()
				c.subject.enable()
				c.redirect_url.enable()
				c = this.emailForm.controls.email_change_email["controls"]
				c.message.enable()
				c.subject.enable()
				c.redirect_url.enable()
			} else {
				this.emailForm.controls.entity.disable();
				this.emailForm.controls.query.disable();
				let c = this.emailForm.controls.email_signup["controls"]
				c.message.disable()
				c.subject.disable()
				c.redirect_url.disable()
				c = this.emailForm.controls.email_lost_password["controls"]
				c.message.disable()
				c.subject.disable()
				c.redirect_url.disable()
				c = this.emailForm.controls.email_change_email["controls"]
				c.message.disable()
				c.subject.disable()
				c.redirect_url.disable()
			}
		});
	}

	getQueries(entityName) {
		if (entityName) {
			const entity = this.app.entities.get(entityName);
			this.queries = entity.getQueries();
		} else {
			this.queries = [];
		}
	}

	saveClick() {
		const config = { name: "@materia/users" };
		this.save.emit(config);
	}

	finish() {
		const setupConfig = Object.assign(
			{},
			this.loginForm.value,
			{
				fields: this.userForm.controls.fields.value.map(f => {
					delete f.readonly;
					f.signup = f.required;
					return f;
				})
			},
			{
				email_verification: this.emailForm.controls.email_verification.value,
				email_action: {
					entity: this.emailForm.controls.entity.value,
					query: this.emailForm.controls.query.value
				},
				email_signup: this.emailForm.controls.email_signup.value,
				email_lost_password: this.emailForm.controls.email_lost_password.value,
				email_change_email: this.emailForm.controls.email_change_email.value
			}
		);
		this.save.emit(setupConfig);
	}

	close() {
		this.cancel.emit();
	}
}
