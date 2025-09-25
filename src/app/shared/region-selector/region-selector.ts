// src/app/shared/components/region-selector/region-selector.ts
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, forwardRef, Input, inject } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, NG_VALIDATORS, Validator, ValidationErrors, ReactiveFormsModule, FormControl, FormGroup, NonNullableFormBuilder } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { of, defer, from } from 'rxjs';
import { startWith, switchMap, tap, shareReplay, map } from 'rxjs/operators';
import { RegionSyncService } from'../services/region.sync.service';
import type { Region as DbRegion } from '../db/his-db'; 
import type { RegionValue } from '../models/region.model';
export { RegionValue };

@Component({
  selector: 'app-region-selector',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatSelectModule],
  template: `
  <div [formGroup]="form" class="contents">
    <!-- 省 -->
    <mat-form-field appearance="outline" class="w-full">
       <mat-label>居住地-省</mat-label>
      <mat-select placeholder="请选择省" formControlName="province">

        <mat-option *ngFor="let p of provinces$ | async; trackBy: trackByCode" [value]="p.code">
          {{ p.name }}
        </mat-option>
      </mat-select>
    </mat-form-field>

    <!-- 市 -->
    <mat-form-field appearance="outline" class="w-full">
          <mat-label>居住地-市</mat-label>
      <mat-select placeholder="请选择市" formControlName="city">
        <mat-option *ngFor="let c of cities$ | async; trackBy: trackByCode" [value]="c.code">
          {{ c.name }}
        </mat-option>
      </mat-select>
    </mat-form-field>

    <!-- 区/县 -->
    <ng-container *ngIf="showCounty">
      <mat-form-field appearance="outline" class="w-full">
            <mat-label>居住地-区/县</mat-label>
        <mat-select placeholder="请选择区/县" formControlName="county" >
          <mat-option *ngFor="let d of counties$ | async; trackBy: trackByCode" [value]="d.code">
            {{ d.name }}
          </mat-option>
        </mat-select>
      </mat-form-field>
    </ng-container>
  </div>
  `,
  styles: [`.w-full{width:100%}`,`.contents{display: contents}`,':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => RegionSelectorComponent), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => RegionSelectorComponent), multi: true }
  ]
})
export class RegionSelectorComponent implements ControlValueAccessor, Validator {
  @Input() showCounty = true;
  @Input() required = false;
@Input() provincePlaceholder = '省';
@Input() cityPlaceholder = '市';
@Input() countyPlaceholder = '县';
  private repo = inject(RegionSyncService);
  private fb = inject(NonNullableFormBuilder);

  form = this.fb.group({
    province: this.fb.control<string>(''),
    city:     this.fb.control<string>({ value: '', disabled: false }),
    county:   this.fb.control<string>({ value: '', disabled: false }),
  });

  // 省列表：一次性加载并缓存
  provinces$ = this.repo.loadChildren$('').pipe(shareReplay(1));

  // 市列表：根据省变更加载
  cities$ = this.form.controls.province.valueChanges.pipe(
    startWith(this.form.controls.province.value),
    tap(() => this.form.controls.city.setValue('', { emitEvent: false })),    // 级联重置
    tap(() => this.form.controls.county.setValue('', { emitEvent: false })),
    switchMap(code => code ? from(this.repo.loadChildren$(code)) : of([] as DbRegion [])),
    shareReplay(1)
  );

  // 区县列表：根据市变更加载
  counties$ = this.form.controls.city.valueChanges.pipe(
    startWith(this.form.controls.city.value),
    tap(() => this.form.controls.county.setValue('', { emitEvent: false })),
    switchMap(code => (this.showCounty && code) ? from(this.repo.loadChildren$(code)) : of([] as DbRegion[])),
    shareReplay(1)
  );

  // ------- CVA ----------
  private onChange: (val: RegionValue | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    // 将内部表单变化映射为 RegionValue 往外抛
    this.form.valueChanges.pipe(
      map(v => {
        const val: RegionValue = { provinceCode: v.province ?? '' };
        if (v.city)   val.cityCode   = v.city;
        if (v.county) val.countyCode = v.county;
        return val;
      })
    ).subscribe(val => this.onChange(this.normalizeValue(val)));
  }

  writeValue(val: RegionValue | null): void {
    const v = this.normalizeValue(val);
    this.form.setValue({
      province: v?.provinceCode ?? '',
      city:     v?.cityCode ?? '',
      county:   v?.countyCode ?? '',
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
    // 省选了但市/县未选时保持 undefined（父表单好判断）
    return {
      provinceCode: v.provinceCode || '',
      cityCode:     v.cityCode || undefined,
      countyCode:   this.showCounty ? (v.countyCode || undefined) : undefined
    };
  }
}
