// src/app/shared/components/region-selector/region-selector.ts
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, forwardRef, Input, inject } from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  NG_VALIDATORS,
  Validator,
  ValidationErrors,
  ReactiveFormsModule,
  NonNullableFormBuilder,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { of, from } from 'rxjs';
import { startWith, switchMap, tap, shareReplay, map } from 'rxjs/operators';
import { RegionSyncService } from '../services/region.sync.service';
import type { Region as DbRegion } from '../db/his-db';
import type { RegionValue } from '../models/region.model';
export { RegionValue };

@Component({
  selector: 'app-region-selector',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatSelectModule, MatInputModule],
  template: `
    <section class="region-group" [formGroup]="form">
      <div class="group-title">{{ groupTitle }}</div>
      <div class="fields-grid">
        <!-- 省 -->
        <mat-form-field appearance="outline" class="field">
          <mat-label>{{ provinceLabel }}</mat-label>
          <mat-select [placeholder]="provincePlaceholder" formControlName="province">
            <mat-option *ngFor="let p of provinces$ | async; trackBy: trackByCode" [value]="p.code">
              {{ p.name }}
            </mat-option>
          </mat-select>
        </mat-form-field>

        <!-- 市 -->
        <mat-form-field appearance="outline" class="field">
          <mat-label>{{ cityLabel }}</mat-label>
          <mat-select [placeholder]="cityPlaceholder" formControlName="city">
            <mat-option *ngFor="let c of cities$ | async; trackBy: trackByCode" [value]="c.code">
              {{ c.name }}
            </mat-option>
          </mat-select>
        </mat-form-field>

        <!-- 区/县 -->
        <ng-container *ngIf="showCounty">
          <mat-form-field appearance="outline" class="field">
            <mat-label>{{ countyLabel }}</mat-label>
            <mat-select [placeholder]="countyPlaceholder" formControlName="county">
              <mat-option *ngFor="let d of counties$ | async; trackBy: trackByCode" [value]="d.code">
                {{ d.name }}
              </mat-option>
            </mat-select>
          </mat-form-field>
        </ng-container>

        <!-- 详细地址 -->
        <mat-form-field appearance="outline" class="field address-field">
          <mat-label>{{ addressLabel }}</mat-label>
          <input
            matInput
            formControlName="address"
            [placeholder]="addressPlaceholder"
            autocomplete="address-line1"
          />
        </mat-form-field>
      </div>
    </section>
  `,
  styles: [
    `:host { display: block; width: 100%; }`,
    `:host-context(.form-grid) { grid-column: 1 / -1; }`,
    `.region-group {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 20px;
      border-radius: 16px;
      border: 1px solid #d0d7de;
      background: linear-gradient(180deg, #ffffff 0%, #f5f9ff 100%);
      box-shadow: 0 6px 18px rgba(25, 118, 210, 0.08);
    }`,
    `.group-title {
      font-size: 18px;
      font-weight: 600;
      color: #1976d2;
      display: flex;
      align-items: center;
      gap: 8px;
    }`,
    `.fields-grid {
      display: grid;
      gap: 16px;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    }`,
    `.field { width: 100%; }`,
    `.address-field { grid-column: 1 / -1; }`,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => RegionSelectorComponent), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => RegionSelectorComponent), multi: true }
  ]
})
export class RegionSelectorComponent implements ControlValueAccessor, Validator {
  @Input() showCounty = true;
  @Input() required = false;
  @Input() groupTitle = '居住地';
  @Input() provinceLabel = '居住地-省';
  @Input() cityLabel = '居住地-市';
  @Input() countyLabel = '居住地-区/县';
  @Input() addressLabel = '居住地-详细地址';
  @Input() provincePlaceholder = '请选择省';
  @Input() cityPlaceholder = '请选择市';
  @Input() countyPlaceholder = '请选择区/县';
  @Input() addressPlaceholder = '请输入详细地址';

  private repo = inject(RegionSyncService);
  private fb = inject(NonNullableFormBuilder);

  form = this.fb.group({
    province: this.fb.control<string>(''),
    city: this.fb.control<string>({ value: '', disabled: false }),
    county: this.fb.control<string>({ value: '', disabled: false }),
    address: this.fb.control<string>(''),
  });

  // 省列表：一次性加载并缓存
  provinces$ = this.repo.loadChildren$('').pipe(shareReplay(1));

  // 市列表：根据省变更加载
  cities$ = this.form.controls.province.valueChanges.pipe(
    startWith(this.form.controls.province.value),
    tap(() => this.form.controls.city.setValue('', { emitEvent: false })),    // 级联重置
    tap(() => this.form.controls.county.setValue('', { emitEvent: false })),
    switchMap(code => (code ? from(this.repo.loadChildren$(code)) : of([] as DbRegion[]))),
    shareReplay(1)
  );

  // 区县列表：根据市变更加载
  counties$ = this.form.controls.city.valueChanges.pipe(
    startWith(this.form.controls.city.value),
    tap(() => this.form.controls.county.setValue('', { emitEvent: false })),
    switchMap(code => (this.showCounty && code ? from(this.repo.loadChildren$(code)) : of([] as DbRegion[]))),
    shareReplay(1)
  );

  // ------- CVA ----------
  private onChange: (val: RegionValue | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    // 将内部表单变化映射为 RegionValue 往外抛
    this.form.valueChanges.pipe(
      tap(() => this.onTouched()),
      map(v => {
        const val: RegionValue = { provinceCode: v.province ?? '' };
        if (v.city) {
          val.cityCode = v.city;
        }
        if (this.showCounty && v.county) {
          val.countyCode = v.county;
        }
        const address = v.address?.trim();
        if (address) {
          val.detailAddress = address;
        }
        return val;
      })
    ).subscribe(val => this.onChange(this.normalizeValue(val)));
  }

  writeValue(val: RegionValue | null): void {
    const v = this.normalizeValue(val);
    this.form.setValue({
      province: v?.provinceCode ?? '',
      city: v?.cityCode ?? '',
      county: v?.countyCode ?? '',
      address: v?.detailAddress ?? '',
    }, { emitEvent: false });
  }

  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void {
    isDisabled ? this.form.disable({ emitEvent: false }) : this.form.enable({ emitEvent: false });
  }

  // ------- 校验（可选） ----------
  validate(): ValidationErrors | null {
    if (!this.required) return null;
    // 简单规则：至少选了省
    return this.form.controls.province.value ? null : { required: true };
  }

  // ------- 工具 ----------
  trackByCode = (_: number, it: DbRegion) => it.code;

  private normalizeValue(v: RegionValue | null): RegionValue | null {
    if (!v) return null;
    const detailAddress = v.detailAddress?.trim();
    return {
      provinceCode: v.provinceCode || '',
      cityCode: v.cityCode || undefined,
      countyCode: this.showCounty ? (v.countyCode || undefined) : undefined,
      detailAddress: detailAddress || undefined,
    };
  }
}
