import {
  Component,
  OnInit,
  Output,
  EventEmitter,
  ViewChild,
  TemplateRef,
  Input,
  OnChanges
} from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';

@Component({
  selector: 'materia-signup-form',
  templateUrl: './signup-form.component.html',
  styleUrls: ['./signup-form.component.scss']
})
export class SignupFormComponent implements OnInit, OnChanges {
  @Output() signup: EventEmitter<any> = new EventEmitter();
  @Output() cancel: EventEmitter<void> = new EventEmitter();

  @ViewChild('template') template: TemplateRef<any>;

  signupForm: FormGroup;

  @Input() profileFields: any;

  constructor(private fb: FormBuilder) {}

  ngOnChanges(changes) {
    if (changes.profileFields && changes.profileFields.currentValue) {
      this.initForm();
    }
  }
  private initForm() {
    this.signupForm = this.fb.group(Object.assign({}, {
      email: ['', Validators.required],
      password: ['', Validators.required]
    }, this.getProfileFormGroup()));
  }

  private getProfileFormGroup() {
    if (! this.profileFields) { return {}; }
    const result: any = {};
    this.profileFields.forEach(field => {
      if (field.required) {
        result[field.name] = ['', Validators.required];
      } else {
        result[field.name] = '';
      }
    });
    return result;
  }

  ngOnInit(): void {
    this.initForm();
  }

  signupClick() {
    this.signup.emit(this.signupForm.value);
  }
}
