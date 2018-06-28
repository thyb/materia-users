import { Component, OnInit, Inject, Output, EventEmitter, ViewChild, TemplateRef } from '@angular/core';
import { AddonComponent } from '@materia/addons';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';

@AddonComponent({
	package: '@materia/users',
	entryComponent: true
})
@Component({
	selector: 'materia-signup-form',
	templateUrl: './signup-form.component.html',
	styleUrls: ['./signup-form.component.scss']
})
export class SignupFormComponent implements OnInit {
	@Output() signup: EventEmitter<any> = new EventEmitter();
	@Output() cancel:EventEmitter<void> = new EventEmitter();

	@ViewChild('template') template: TemplateRef<any>;

	signupForm: FormGroup;

	constructor(@Inject('FormBuilder') private fb: FormBuilder) {
	}

	ngOnInit(): void { 
		this.signupForm = this.fb.group({
			email: ['', Validators.required],
			password: ['', Validators.required]
		})
	}

	signupClick() {
		this.signup.emit(this.signupForm.value);
	}
}
