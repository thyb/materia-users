const ngcore = (window as any).angular.core;
const ngforms = (window as any).angular.forms
const Component = ngcore.Component;
const EventEmitter = ngcore.EventEmitter;
const OnInit = ngcore.OnInit;
const Output = ngcore.Output;
import { FormGroup } from "@angular/forms";
import { Input } from "@angular/core";


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
    loginForm: FormGroup;
    emailForm: FormGroup;
    userForm: FormGroup;
    @Input() formBuilder;

    config: any;

    @Output() save = new EventEmitter();
    @Output() cancel = new EventEmitter();

    constructor() {
        this.loginForm = this.formBuilder.group({
            test: [""]
        });
        this.emailForm = this.formBuilder.group({
            test: [""]
        });
        this.userForm = this.formBuilder.group({
            test: [""]
        });
    }

    saveClick() {
        this.save.emit(this.config);
    }
    cancelClick() {
        this.cancel.emit();
    }
}