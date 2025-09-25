import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, forwardRef, Input, inject, signal } from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALIDATORS, NG_VALUE_ACCESSOR, ReactiveFormsModule, ValidationErrors, Validator } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { combineLatest, Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DictService } from '../services/dict.service';
import type { Country } from '../models/dict.model';

@Component({
  selector: 'app-nationality-selector',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatIconModule,
    MatButtonModule
  ],
  template: `
    <mat-form-field appearance="outline" class="selector-field" color="primary">
      <mat-label>{{ label }}</mat-label>
      <mat-icon matPrefix class="prefix-icon">public</mat-icon>
      <input
        matInput
        [formControl]="inputCtrl"
        [matAutocomplete]="auto"
        [placeholder]="placeholder"
        (blur)="handleBlur()"
        (keydown.enter)="$event.preventDefault()"
      />
      <button
        *ngIf="!required && !!inputCtrl.value"
        mat-icon-button
        type="button"
        matSuffix
        (click)="clearSelection()"
        aria-label="清除已选国籍"
      >
        <mat-icon>close</mat-icon>
      </button>
      <mat-hint *ngIf="hint">{{ hint }}</mat-hint>
      <mat-error *ngIf="inputCtrl.hasError('invalidOption')">请选择下拉列表中的国籍</mat-error>
      <mat-error *ngIf="showRequiredError()">国籍为必填项</mat-error>
      <mat-autocomplete
        #auto="matAutocomplete"
        [displayWith]="displayCountry"
        [autoActiveFirstOption]="true"
        (optionSelected)="pickCountry($event.option.value)"
      >
        @for (country of filteredCountries$ | async; track country.code) {
          <mat-option [value]="country">
            <div class="option-line">
              <span class="option-name">{{ country.name_cn }}</span>
              <span class="option-code">{{ country.code }}</span>
              <span class="option-en">{{ country.name_en }}</span>
            </div>
          </mat-option>
        } @empty {
          <mat-option disabled>暂无匹配数据</mat-option>
        }
      </mat-autocomplete>
    </mat-form-field>
  `,
  styles: [
    `:host { display: block; }`,
    `.selector-field { width: 100%; background: linear-gradient(135deg, rgba(33, 150, 243, 0.08), rgba(156, 39, 176, 0.05)); border-radius: 12px; padding: 4px 8px; }`,
    `.prefix-icon { color: #1976d2; margin-right: 4px; }`,
    `.option-line { display: flex; justify-content: space-between; align-items: center; gap: 12px; font-size: 13px; }`,
    `.option-name { font-weight: 600; color: #374151; }`,
    `.option-code { font-family: 'Roboto Mono', monospace; color: #5c6bc0; }`,
    `.option-en { color: #6b7280; font-size: 12px; }`
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => NationalitySelectorComponent), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => NationalitySelectorComponent), multi: true }
  ]
})
export class NationalitySelectorComponent implements ControlValueAccessor, Validator {
  private dict = inject(DictService);

  @Input() label = '国籍';
  @Input() placeholder = '输入中文、英文或国家代码搜索';
  @Input() required = false;
  @Input() hint = '可通过中文、英文名称或代码快速定位';

  readonly inputCtrl = new FormControl('', { nonNullable: true });

  private latestList: Country[] = [];
  private value: string | null = null;
  private touched = signal(false);

  readonly countries$: Observable<Country[]> = this.dict.getCountries();
  readonly filteredCountries$: Observable<Country[]> = combineLatest([
    this.countries$,
    this.inputCtrl.valueChanges.pipe(startWith(''))
  ]).pipe(
    map(([list, keyword]) => {
      const kw = keyword.trim().toLowerCase();
      if (!kw) {
        return list;
      }
      return list.filter(country => {
        const nameCn = country.name_cn?.toLowerCase() ?? '';
        const nameEn = country.name_en?.toLowerCase() ?? '';
        const code = country.code?.toLowerCase() ?? '';
        const py = country.name_py_first?.toLowerCase() ?? '';
        return (
          nameCn.includes(kw) ||
          nameEn.includes(kw) ||
          code.startsWith(kw) ||
          py.startsWith(kw)
        );
      });
    })
  );

  constructor() {
    this.countries$
      .pipe(takeUntilDestroyed())
      .subscribe(list => {
        this.latestList = list ?? [];
        this.syncInputWithValue();
      });
  }

  displayCountry = (country: Country | string | null | undefined): string => {
    if (!country) {
      return '';
    }
    if (typeof country === 'string') {
      return country;
    }
    return country.name_cn ?? country.name_en ?? '';
  };

  pickCountry(country: Country) {
    this.value = country.code ?? null;
    this.inputCtrl.setValue(country.name_cn ?? '', { emitEvent: false });
    this.inputCtrl.setErrors(null);
    this.notifyChange();
  }

  handleBlur() {
    this.touched.set(true);
    this.onTouched();
    const txt = this.inputCtrl.value.trim();
    if (!txt) {
      if (this.required) {
        this.value = null;
        this.inputCtrl.setErrors({ required: true });
      } else {
        this.value = null;
        this.inputCtrl.setErrors(null);
      }
      this.notifyChange();
      return;
    }
    const match = this.findMatch(txt);
    if (match) {
      this.value = match.code ?? null;
      this.inputCtrl.setValue(match.name_cn ?? '', { emitEvent: false });
      this.inputCtrl.setErrors(null);
    } else {
      this.value = null;
      this.inputCtrl.setErrors({ invalidOption: true });
    }
    this.notifyChange();
  }

  clearSelection() {
    this.touched.set(true);
    this.value = null;
    this.inputCtrl.setValue('', { emitEvent: false });
    this.inputCtrl.setErrors(null);
    this.notifyChange();
    this.onTouched();
  }

  validate(): ValidationErrors | null {
    if (this.inputCtrl.hasError('invalidOption')) {
      return { invalidOption: true };
    }
    if (this.required && !this.value) {
      return { required: true };
    }
    return null;
  }

  writeValue(code: string | null): void {
    this.value = code;
    this.inputCtrl.setErrors(null);
    this.syncInputWithValue();
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    isDisabled ? this.inputCtrl.disable({ emitEvent: false }) : this.inputCtrl.enable({ emitEvent: false });
  }

  showRequiredError() {
    return this.required && this.touched() && !this.value && !this.inputCtrl.hasError('invalidOption');
  }

  private syncInputWithValue() {
    if (!this.value) {
      this.inputCtrl.setValue('', { emitEvent: false });
      return;
    }
    if (!this.latestList?.length) {
      return;
    }
    const match = this.latestList.find(item => item.code === this.value);
    this.inputCtrl.setValue(match ? (match.name_cn ?? match.name_en ?? '') : '', { emitEvent: false });
  }

  private findMatch(keyword: string): Country | undefined {
    const kw = keyword.trim().toLowerCase();
    return this.latestList.find(country => {
      const nameCn = country.name_cn?.trim().toLowerCase() ?? '';
      const nameEn = country.name_en?.trim().toLowerCase() ?? '';
      const code = country.code?.trim().toLowerCase() ?? '';
      const py = country.name_py_first?.trim().toLowerCase() ?? '';
      return kw === nameCn || kw === nameEn || kw === code || kw === py;
    });
  }

  private notifyChange() {
    this.onChange(this.value);
  }

  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};
}
