import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { NgxChartsModule } from '@swimlane/ngx-charts';

import {
  MatButtonModule,
  MatRippleModule,
  MatSnackBarModule,
  MatCardModule,
  MatIconModule,
  MatDialogModule,
  MatInputModule,
  MatListModule,
  MatTooltipModule,
  MatToolbarModule,
  MatDatepickerModule,
  MatNativeDateModule,
  MatRadioModule,
  MatStepperModule,
  MatSelectModule,
  MatCheckboxModule
} from '@angular/material';

import { Addon } from '@materia/addons';

import { UserManagementViewComponent } from './user-management/user-management.component';
import { HttpClientModule } from '@angular/common/http';
import { SignupFormComponent } from './signup-form/signup-form.component';
import { UserManagementSetupComponent } from './user-management-setup/user-management-setup.component';
import { ParamInputComponent } from './param-input/param-input.component';

@Addon('@materia/users')
@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    FlexLayoutModule,
    MatRippleModule,
    MatButtonModule,
    MatSnackBarModule,
    MatCardModule,
    MatIconModule,
    MatDialogModule,
    MatInputModule,
    MatTooltipModule,
    MatCheckboxModule,
    MatSelectModule,
    MatToolbarModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatListModule,
    MatRadioModule,
    NgxChartsModule,
    MatStepperModule
  ],
  declarations: [
    UserManagementViewComponent,
    UserManagementSetupComponent,
    SignupFormComponent,
    ParamInputComponent
  ],
  exports: [UserManagementViewComponent],
  entryComponents: []
})
export class UserManagementModule {}
