import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

// Angular Material 需要用到的模块（先选常用控件）
// 表单外壳容器（支持外观 outline、fill、hint 等）
import { MatFormFieldModule } from '@angular/material/form-field';

// 文本输入框（<input matInput>）
import { MatInputModule }      from '@angular/material/input';

// 下拉选择框（<mat-select>）
import { MatSelectModule }     from '@angular/material/select';

// 单选按钮组（<mat-radio-group>/<mat-radio-button>）
import { MatRadioModule }      from '@angular/material/radio';

// 复选框（<mat-checkbox>）
import { MatCheckboxModule }   from '@angular/material/checkbox';

// 日期选择器（<mat-datepicker>）
import { MatDatepickerModule } from '@angular/material/datepicker';

// 日期选择器的本地化支持（使用浏览器本地日期对象）
import { MatNativeDateModule } from '@angular/material/core';

// 开关（Slide Toggle）
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

// 滑块（Slider）
import { MatSliderModule } from '@angular/material/slider';

// 自动完成（Autocomplete）
import { MatAutocompleteModule } from '@angular/material/autocomplete';


// 按钮（<button mat-button>, <button mat-raised-button> 等）
import { MatButtonModule }     from '@angular/material/button';

// 图标支持（<mat-icon>，依赖 Material Icons 字体）
import { MatIconModule }       from '@angular/material/icon';
import { MatCardModule }      from '@angular/material/card';

@Component({
  selector: 'app-form-demo',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatRadioModule, MatCheckboxModule, MatDatepickerModule, MatNativeDateModule,
    MatSlideToggleModule, MatSliderModule, MatAutocompleteModule,
    MatButtonModule, MatIconModule, MatCardModule
  ],
  templateUrl: './form-demo.html',
  styleUrls: ['./form-demo.scss']
})
export class FormDemoComponent {
  private fb = inject(FormBuilder);

  // 表单模型（Reactive Forms）
  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    gender: ['male', Validators.required],                 // 单选
    dept:   ['', Validators.required],                     // 下拉
    birthday: [null, Validators.required],                 // 日期
    phone: ['', [Validators.pattern(/^1[3-9]\d{9}$/)]],    // 简单手机校验（可按需调整）
    agree:  [false, Validators.requiredTrue],              // 勾选同意
    enableNotify: [true],                                  // 开关
    painLevel: [3],                                        // 滑块
    tags: [''],                                            // 自动完成输入
  });

  // 下拉选项 / 自动完成选项
  depts = ['内科', '外科', '儿科', '急诊', '药房'];
  tagOptions = ['糖尿病', '高血压', '过敏', '哮喘', '术后'];

  submitted = false;
  resultJson = '';

  submit() {
    this.submitted = true;
    if (this.form.invalid) return;
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
