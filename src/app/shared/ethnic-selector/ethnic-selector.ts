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
import type { Ethnic } from '../models/dict.model';

@Component({
  selector: 'app-ethnic-selector',
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
      <mat-icon matPrefix class="prefix-icon">diversity_3</mat-icon>
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
        aria-label="清除民族"
      >
        <mat-icon>close</mat-icon>
      </button>
      <mat-hint *ngIf="hint">{{ hint }}</mat-hint>
      <mat-error *ngIf="inputCtrl.hasError('invalidOption')">请选择有效的民族</mat-error>
      <mat-error *ngIf="showRequiredError()">民族为必填项</mat-error>
      <mat-autocomplete
        #auto="matAutocomplete"
        [displayWith]="displayEthnic"
        [autoActiveFirstOption]="true"
        (optionSelected)="pickEthnic($event.option.value)"
      >
        @for (ethnic of filteredEthnics$ | async; track ethnic.code) {
          <mat-option [value]="ethnic">
            <div class="option-line">
              <span class="option-name">{{ ethnic.name }}</span>
              <span class="option-code">{{ ethnic.code }}</span>
              <span class="option-en">{{ ethnic.name_py_first }}</span>
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
    `.selector-field { width: 100%; background: linear-gradient(135deg, rgba(76, 175, 80, 0.08), rgba(0, 150, 136, 0.05)); border-radius: 12px; padding: 4px 8px; }`,
    `.prefix-icon { color: #2e7d32; margin-right: 4px; }`,
    `.option-line { display: flex; justify-content: space-between; align-items: center; gap: 12px; font-size: 13px; }`,
    `.option-name { font-weight: 600; color: #374151; }`,
    `.option-code { font-family: 'Roboto Mono', monospace; color: #26a69a; }`,
    `.option-en { color: #6b7280; font-size: 12px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => EthnicSelectorComponent), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => EthnicSelectorComponent), multi: true }
  ]
})
export class EthnicSelectorComponent implements ControlValueAccessor, Validator {
  private dict = inject(DictService);

  @Input() label = '民族';
  @Input() placeholder = '请输入民族名称或拼音首字母';
  @Input() required = false;
  @Input() hint = '支持输入中文、拼音全称或首字母检索';

  readonly inputCtrl = new FormControl('', { nonNullable: true });

  private latestList: Ethnic[] = [];
  private value: string | null = null;
  private touched = signal(false);

  readonly ethnics$: Observable<Ethnic[]> = this.dict.getEthnics();
  readonly filteredEthnics$: Observable<Ethnic[]> = combineLatest([
    this.ethnics$,
    this.inputCtrl.valueChanges.pipe(startWith(''))
  ]).pipe(
    map(([list, keyword]) => {
      const kw = keyword.trim().toLowerCase();
      if (!kw) {
        return list;
      }
      return list.filter(item => {
        const name = item.name?.toLowerCase() ?? '';
        const full = item.name_py?.toLowerCase() ?? '';
        const first = item.name_py_first?.toLowerCase() ?? '';
        return name.includes(kw) || full.startsWith(kw) || first.startsWith(kw);
      });
    })
  );

  constructor() {
    this.ethnics$
      .pipe(takeUntilDestroyed())
      .subscribe(list => {
        this.latestList = list ?? [];
        this.syncInputWithValue();
      });
  }

  displayEthnic = (ethnic: Ethnic | string | null | undefined): string => {
    if (!ethnic) {
      return '';
    }
    if (typeof ethnic === 'string') {
      return ethnic;
    }
    return ethnic.name ?? '';
  };

  pickEthnic(ethnic: Ethnic) {
    this.value = ethnic.code ?? null;
    this.inputCtrl.setValue(ethnic.name ?? '', { emitEvent: false });
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
      this.inputCtrl.setValue(match.name ?? '', { emitEvent: false });
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
    this.inputCtrl.setValue(match ? match.name ?? '' : '', { emitEvent: false });
  }

  private findMatch(keyword: string): Ethnic | undefined {
    const kw = keyword.trim().toLowerCase();
    return this.latestList.find(item => {
      const name = item.name?.trim().toLowerCase() ?? '';
      const full = item.name_py?.trim().toLowerCase() ?? '';
      const first = item.name_py_first?.trim().toLowerCase() ?? '';
      return kw === name || kw === full || kw === first;
    });
  }

  private notifyChange() {
    this.onChange(this.value);
  }

  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};
}
