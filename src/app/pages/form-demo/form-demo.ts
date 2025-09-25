import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { RegionSelectorComponent, RegionValue } from '../../shared/region-selector/region-selector';
import { NationalitySelectorComponent } from '../../shared/nationality-selector/nationality-selector';
import { EthnicSelectorComponent } from '../../shared/ethnic-selector/ethnic-selector';

@Component({
  selector: 'app-form-demo',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSlideToggleModule,
    MatSliderModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    RegionSelectorComponent,
    NationalitySelectorComponent,
    EthnicSelectorComponent
  ],
  templateUrl: './form-demo.html',
  styleUrls: ['./form-demo.scss']
})
export class FormDemoComponent {
  private fb = inject(FormBuilder);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    gender: ['male', Validators.required],
    nationality: ['CHN', Validators.required],
    region: this.fb.control<RegionValue | null>(null),
    ethnic: ['01', Validators.required],
    dept: ['', Validators.required],
    birthday: [null, Validators.required],
    phone: ['', [Validators.pattern(/^1[3-9]\d{9}$/)]],
    agree: [false, Validators.requiredTrue],
    enableNotify: [true],
    painLevel: [3],
    tags: ['']
  });

  depts = ['内科', '外科', '儿科', '急诊', '药房'];
  tagOptions = ['糖尿病', '高血压', '过敏', '哮喘', '术后'];

  submitted = false;
  resultJson = '';

  submit() {
    this.submitted = true;
    if (this.form.invalid) {
      return;
    }
    this.resultJson = JSON.stringify(this.form.value, null, 2);
  }

  reset() {
    this.form.reset({
      gender: 'male',
      enableNotify: true,
      painLevel: 3
    });
    this.submitted = false;
    this.resultJson = '';
  }
}
