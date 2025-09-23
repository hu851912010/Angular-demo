import { Component, inject, ViewChild, ElementRef  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators,FormControl } from '@angular/forms';
import { map, startWith } from 'rxjs/operators';
import { Observable,combineLatest  } from 'rxjs';
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
import{ Country, Ethnic} from'../../shared/models/dict.model';
import{DictService} from'../../shared/services/dict.service';
import { MatSelect } from '@angular/material/select';
import { RegionValue, RegionSelectorComponent } from '../../shared/region-selector/region-selector';
@Component({
  selector: 'app-form-demo',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatRadioModule, MatCheckboxModule, MatDatepickerModule, MatNativeDateModule,
    MatSlideToggleModule, MatSliderModule, MatAutocompleteModule,
    MatButtonModule, MatIconModule, MatCardModule, MatSelect,
    RegionSelectorComponent
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
    nationality: ['CHN', Validators.required],                // 国籍下拉
    region: this.fb.control<RegionValue | null>(null),          // 省市区
    ethnic: ['01', Validators.required],                     // 民族下拉
    dept:   ['', Validators.required],                     // 下拉
    birthday: [null, Validators.required],                 // 日期
    phone: ['', [Validators.pattern(/^1[3-9]\d{9}$/)]],    // 简单手机校验（可按需调整）
    agree:  [false, Validators.requiredTrue],              // 勾选同意
    enableNotify: [true],                                  // 开关
    painLevel: [3],                                        // 滑块
    tags: [''],                                            // 自动完成输入
  });
  private dict = inject(DictService);

  // 下拉选项 / 自动完成选项
  depts = ['内科', '外科', '儿科', '急诊', '药房'];
  tagOptions = ['糖尿病', '高血压', '过敏', '哮喘', '术后'];

  submitted = false;
  resultJson = '';
//#region 国籍选择
 countrylatestList: Country[] = [];
  // 1) 真正提交给后端的值（默认中国）
  countryCodeCtrl = this.fb.nonNullable.control<string>('CHN');
   displayCountry = (value: Country | string | null | undefined): string => {
    if (value == null) return '';           // 允许为空时显示空
    if (typeof value === 'string') return value; // 有时控件里可能是字符串
    return value.name_cn ?? '';             // 始终返回 string|null
  };

  // 2) 输入框（用来搜索/显示中文名，不直接提交后端）
  inputCtrl = new FormControl<string>('', { nonNullable: true });

  // 3) 你的异步数据源：替换为真实的服务返回
  countries$: Observable<Country[]> = this.dict.getCountries();

  // 4) 过滤后的候选项（本地过滤）
  filtered$: Observable<Country[]> = combineLatest([
    this.countries$,
    this.inputCtrl.valueChanges.pipe(startWith('')),
  ]).pipe(
    map(([list, q]) => {
      const kw = (typeof q ==='string'?q:this.displayCountry(q)).trim().toLowerCase();
      if (!kw) return list;
      return list.filter(c =>
        (c.name_cn ?? '').toLowerCase().startsWith(kw) ||
        (c.name_en ?? '').toLowerCase().startsWith(kw) ||
        (c.code ?? '').toLowerCase().startsWith(kw)||
        (c.name_py_first ?? '').toLowerCase().startsWith(kw)
      );
    })
  );
  // 选中后：表单值=code；输入框显示中文
  pick(c: Country) {
    this.countryCodeCtrl.setValue(c.code);
    this.inputCtrl.setValue(c.name_cn, { emitEvent: false });
  }
onCountryBlurExactMatch() {
  const txt = (this.inputCtrl.value ?? '').trim();
  if (!txt) {
    // 空值：清空并报错（可按需改为允许空）
    this.countryCodeCtrl.setValue('');
    this.inputCtrl.setErrors({ invalidOption: true });
    return;
  }

  // 在候选里查找：displayWith(c) 与输入完全一致
  const hit = this.countrylatestList.find(c => this.displayCountry(c).trim() === txt);

  if (hit) {
    // 命中：视为用户已选择该项
    this.countryCodeCtrl.setValue(hit.code);
    // 回填显示值，清除错误
    this.inputCtrl.setValue(this.displayCountry(hit), { emitEvent: false });
    this.inputCtrl.setErrors(null);
  } else {
    // 未命中：无效输入，清空 code 并提示
    this.countryCodeCtrl.setValue('');
    this.inputCtrl.setErrors({ invalidOption: true });
  }
}

//#endregion 国籍选择
//#region 民族选择

  ethniclatestList: Ethnic[] = []; //缓存最后一次匹配列表用于比对失焦比对
   // 1) 真正提交给后端的值（默认汉族）
  ethnicCodeCtrl = this.fb.nonNullable.control<string>('01');
   displayEthnic = (value: Ethnic | string | null | undefined): string => {
    if (value == null) return '';           // 允许为空时显示空
    if (typeof value === 'string') return value; // 有时控件里可能是字符串
    return value.name ?? '';             // 始终返回 string|null
  };
 
  // 2) 输入框（用来搜索/显示中文名，不直接提交后端）
  ethnicsInputCtrl = new FormControl<string>('', { nonNullable: true });

  // 3) 你的异步数据源：替换为真实的服务返回
  ethnics$: Observable<Ethnic[]> = this.dict.getEthnics();
  // 4) 过滤后的候选项（本地过滤）
  filteredeEthnics$: Observable<Ethnic[]> = combineLatest([
    this.ethnics$,
    this.ethnicsInputCtrl.valueChanges.pipe(startWith('')),
  ]).pipe(
    map(([list, q]) => {
      const kw = (typeof q ==='string'?q:this.displayEthnic(q)).trim().toLowerCase();
      if (!kw) return list;
      return list.filter(c =>
        (c.name ?? '').toLowerCase().startsWith(kw)||
        (c.name_py_first ?? '').toLowerCase().startsWith(kw)||
        (c.name_py ?? '').toLowerCase().startsWith(kw)

      );
    })
  );
  // 选中后：表单值=code；输入框显示中文
  pickEthnic(c: Ethnic) {
    this. ethnicCodeCtrl .setValue(c.code);
    this.ethnicsInputCtrl.setValue(c.name, { emitEvent: false });
  }
onEthnicBlurExactMatch() {
  const txt = (this.ethnicsInputCtrl.value ?? '').trim();
  if (!txt) {
    // 空值：清空并报错（可按需改为允许空）
    this.ethnicCodeCtrl.setValue('');
    this.ethnicsInputCtrl.setErrors({ invalidOption: true });
    return;
  }

  // 在候选里查找：displayWith(c) 与输入完全一致
  const hit = this.ethniclatestList.find(c => this.displayEthnic(c).trim() === txt);

  if (hit) {
    // 命中：视为用户已选择该项
    this.ethnicCodeCtrl.setValue(hit.code);
    // 回填显示值，清除错误
    this.ethnicsInputCtrl.setValue(this.displayEthnic(hit), { emitEvent: false });
    this.ethnicsInputCtrl.setErrors(null);
  } else {
    // 未命中：无效输入，清空 code 并提示
    this.ethnicCodeCtrl.setValue('');
    this.ethnicsInputCtrl.setErrors({ invalidOption: true });
  }
}

//#endregion 民族选择
  // 初次挂载时，让输入框与默认值对齐显示（可放在 ngOnInit 里）
  ngOnInit() {
    // 当 countries$ 有数据时，把输入框设为与默认 code 对应的中文名
    this.countries$.subscribe(list => {
      const cn = list.find(x => x.code === this.countryCodeCtrl .value);
      if (cn) this.inputCtrl.setValue(cn.name_cn, { emitEvent: false });
      this.countrylatestList = list ?? [];//缓存最后一次匹配列表用于比对失焦比对
    });

     this.ethnics$.subscribe(list => {
      const hanzu = list.find(x => x.code === this. ethnicCodeCtrl .value);
      if (hanzu) this.ethnicsInputCtrl.setValue(hanzu.name, { emitEvent: false });
      this.ethniclatestList = list ?? [];//缓存最后一次匹配列表用于比对失焦比对
    });
  }
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
