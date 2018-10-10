import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';

import { FormGroup } from '@angular/forms';

const DefaultComponent = Object.freeze({
  text: 'text',
  number: 'text',
  date: 'date',
  float: 'text',
  boolean: 'switch'
});

@Component({
  selector: 'materia-param-input',
  templateUrl: './param-input.component.html',
  styleUrls: ['./param-input.component.scss']
})
export class ParamInputComponent implements OnInit {
  @Input() param: any;
  @Input() disabled: boolean;

  @Input() form: FormGroup;
  @Input() label: string;

  @Input() showAsterisk = true;
  @Input() showCheckbox = true;

  type: string;
  actualComponent: string;

  @Output() changed = new EventEmitter<any>();

  get requiredError() {
    return (
      this.form.get(this.param.name) &&
      this.form.get(this.param.name).hasError('required')
    );
  }

  get checkboxName() {
    return `${this.param.name}_check`;
  }

  constructor() {}

  ngOnInit() {
    this.type = this.param.type;

    if (!this.label) {
      this.label = this.param.name;
      if (this.param.required && this.showAsterisk) {
        this.label += '*';
      }
    }

    if (this.param && this.param.component) {
      if (this.param.component === 'input') {
        if (this.param.type === 'text' || this.param.type === 'string') {
          this.actualComponent = 'text';
        } else if (this.param.type === 'number') {
          this.actualComponent = 'number';
        } else {
          this.actualComponent = this.param.component;
        }
      } else {
        if (this.param.component === 'datePicker') {
          this.actualComponent = 'date';
        } else if (this.param.component === 'timePicker') {
          this.actualComponent = 'time';
        } else if (this.param.component === 'dateTimePicker') {
          this.actualComponent = 'datetime-local';
        } else {
          this.actualComponent = this.param.component;
        }
      }
    } else {
      this.actualComponent = DefaultComponent[this.type];
    }

    if (this.showCheckbox && !this.param.required) {
      this.form.get(this.param.name).valueChanges.subscribe(val => {
        if (val) {
          this.form.get(this.checkboxName).setValue(true);
        } else {
          this.form.get(this.checkboxName).setValue(false);
        }
      });
    }
  }
}
