import {
  Component,
  OnInit,
  Output,
  EventEmitter,
  ViewChild,
  TemplateRef
} from '@angular/core';
import {
  FormBuilder,
  Validators,
  FormGroup
} from '@angular/forms';

@Component({
  selector: 'materia-signup-form',
  templateUrl: './signup-form.component.html',
  styleUrls: ['./signup-form.component.scss']
})
export class SignupFormComponent implements OnInit {
  @Output() signup: EventEmitter<any> = new EventEmitter();
  @Output() cancel: EventEmitter<void> = new EventEmitter();

  @ViewChild('template') template: TemplateRef<any>;

  signupForm: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.signupForm = this.fb.group({
      email: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  signupClick() {
    this.signup.emit(this.signupForm.value);
  }
}
