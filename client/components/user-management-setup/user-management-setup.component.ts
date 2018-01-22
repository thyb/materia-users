const ngcore = (window as any).angular.core;
const Component = ngcore.Component;
const EventEmitter = ngcore.EventEmitter;
const OnInit = ngcore.OnInit;
const Output = ngcore.Output;

export interface UserManagementConfig {
	fields: any[],
	salt: string,
	type: string,
	// emails: {}
}

@Component({
	selector: "materia-user-management-setup",
	templateUrl: "./user-management-setup.component.html",
	styleUrls: ["./user-management-setup.component.scss"]
})
export class UserManagementSetupComponent {
	addon: any;

	config: any;

	@Output() save = new EventEmitter();
	@Output() cancel = new EventEmitter();

	constructor() {}

	saveClick() {
		this.save.emit(this.config);
	}
	cancelClick() {
		this.cancel.emit();
	}
}