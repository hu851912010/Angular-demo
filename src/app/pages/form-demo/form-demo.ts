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
    // 姓名：必填且至少输入两个字符，便于建立基础档案信息
    name: ['', [Validators.required, Validators.minLength(2)]],
    // 性别：默认选中“男”，确保性别信息完整
    gender: ['male', Validators.required],
    // 国籍：默认中国，提供必填校验
    nationality: ['CHN', Validators.required],
    // 地区：借助 RegionSelectorComponent 选择省市区
    region: this.fb.control<RegionValue | null>(null),
    // 民族：默认汉族编码“01”
    ethnic: ['01', Validators.required],
    // 就诊科室：必选，便于后续分诊
    dept: ['', Validators.required],
    // 出生日期：必填，配合日期控件选择
    birthday: [null, Validators.required],
    // 手机号：可选，使用正则校验中国大陆 11 位手机号
    phone: ['', [Validators.pattern(/^1[3-9]\d{9}$/)]],
    // 就诊卡号：必填，限制为 8-12 位数字，保障院内唯一性
    medicalCardNo: ['', [Validators.required, Validators.pattern(/^\d{8,12}$/)]],
    // 隐私协议同意：必须选中
    agree: [false, Validators.requiredTrue],
    // 消息通知开关：默认启用
    enableNotify: [true],
    // 疼痛等级：默认 3 级
    painLevel: [3],
    // 标签：可输入关键字辅助标记
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
