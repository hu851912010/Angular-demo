import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import {
  DoctorLoginFlowService,
  DoctorCampusOption,
  DoctorDepartmentOption,
  DoctorSystemOption
} from '../../services/doctor-login-flow.service';

@Component({
  selector: 'app-doctor-login-context',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSnackBarModule,
    MatDividerModule
  ],
  templateUrl: './context-select.html',
  styleUrls: ['./context-select.scss']
})
export class DoctorLoginContextComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly loginFlow = inject(DoctorLoginFlowService);

  /** 是否处于提交阶段，用于交互反馈。 */
  isSubmitting = false;

  /** 当前登录医生姓名，便于标题问候。 */
  doctorName = '';

  /** 登录第一步的记住账号配置，作为提示展示。 */
  rememberMe = false;

  /** 系统权限选项，依据账号校验结果动态生成。 */
  systemOptions: DoctorSystemOption[] = [];

  /** 当前系统下可选的院区列表。 */
  campusOptions: DoctorCampusOption[] = [];

  /** 当前院区下可选的科室列表。 */
  departmentOptions: DoctorDepartmentOption[] = [];

  /** 页面引导文案，体现分步登录体验。 */
  readonly hints: string[] = [
    '仅展示您有权限访问的系统、院区及科室，避免误入其他业务线。',
    '如需开通更多权限，请联系科室主任或信息科管理员。'
  ];

  /**
   * 权限选择表单，仅包含系统、院区、科室三级字段。
   */
  readonly contextForm = this.fb.group({
    system: ['', Validators.required],
    campus: ['', Validators.required],
    department: ['', Validators.required]
  });

  ngOnInit(): void {
    const profile = this.loginFlow.getActiveProfile();
    if (!profile) {
      this.snackBar.open('登录信息已过期，请重新验证账号。', '重新登录', {
        duration: 3000
      });
      this.router.navigate(['/doctor-login']);
      return;
    }

    this.doctorName = profile.displayName;
    this.systemOptions = profile.systems;
    this.rememberMe = this.loginFlow.getRememberMe();
    this.initializeDefaultSelections();
  }

  /**
   * 初始化默认选择，确保表单拥有有效值。
   */
  private initializeDefaultSelections(): void {
    const firstSystem = this.systemOptions[0];
    if (!firstSystem) {
      this.contextForm.reset();
      return;
    }

    this.updateCampusOptions(firstSystem.value);
    const firstCampus = this.campusOptions[0];
    this.departmentOptions = firstCampus?.departments ?? [];
    const firstDepartment = this.departmentOptions[0];

    this.contextForm.patchValue({
      system: firstSystem.value,
      campus: firstCampus?.value ?? '',
      department: firstDepartment?.value ?? ''
    });
  }

  /**
   * 系统切换时重建院区与科室选项，确保层级联动。
   */
  onSystemChanged(systemValue: string): void {
    this.updateCampusOptions(systemValue);
    const firstCampus = this.campusOptions[0];
    this.departmentOptions = firstCampus?.departments ?? [];
    const firstDepartment = this.departmentOptions[0];

    this.contextForm.patchValue({
      campus: firstCampus?.value ?? '',
      department: firstDepartment?.value ?? ''
    });
  }

  /**
   * 院区切换时重置科室，避免跨院区误选。
   */
  onCampusChanged(campusValue: string): void {
    const campus = this.campusOptions.find((item) => item.value === campusValue);
    this.departmentOptions = campus?.departments ?? [];
    const fallbackDepartment = this.departmentOptions[0]?.value ?? '';
    this.contextForm.patchValue({ department: fallbackDepartment });
  }

  /**
   * 提交最终登录信息，提示成功后跳转到患者列表。
   */
  submit(): void {
    if (this.contextForm.invalid) {
      this.contextForm.markAllAsTouched();
      this.snackBar.open('请选择完整的系统、院区与科室信息。', '好的', {
        duration: 2600
      });
      return;
    }

    this.isSubmitting = true;
    const { system, campus, department } = this.contextForm.getRawValue();
    const systemLabel = this.getSystemLabel(system ?? '');
    const campusLabel = this.getCampusLabel(campus ?? '', system ?? '');
    const departmentLabel = this.getDepartmentLabel(department ?? '', campus ?? '', system ?? '');

    window.setTimeout(() => {
      this.isSubmitting = false;
      this.snackBar.open(
        `${this.doctorName}医生，已为您开启 ${campusLabel}${departmentLabel}${systemLabel}。`,
        undefined,
        {
          duration: 2800
        }
      );
      this.loginFlow.clearSession();
      this.router.navigate(['/patients']);
    }, 500);
  }

  /**
   * 根据系统值更新院区列表。
   */
  private updateCampusOptions(systemValue: string): void {
    const system = this.systemOptions.find((item) => item.value === systemValue);
    this.campusOptions = system?.campuses ?? [];
    this.departmentOptions = this.campusOptions[0]?.departments ?? [];
  }

  private getSystemLabel(systemValue: string): string {
    return this.systemOptions.find((item) => item.value === systemValue)?.label ?? '';
  }

  private getCampusLabel(campusValue: string, systemValue: string): string {
    const system = this.systemOptions.find((item) => item.value === systemValue);
    return system?.campuses.find((item) => item.value === campusValue)?.label ?? '';
  }

  private getDepartmentLabel(
    departmentValue: string,
    campusValue: string,
    systemValue: string
  ): string {
    const system = this.systemOptions.find((item) => item.value === systemValue);
    const campus = system?.campuses.find((item) => item.value === campusValue);
    const department = campus?.departments.find((item) => item.value === departmentValue);
    return department ? `${department.label}` : '';
  }

  /**
   * 返回账号验证页，便于重新选择登录用户。
   */
  backToLogin(): void {
    this.loginFlow.clearSession();
    this.router.navigate(['/doctor-login']);
  }
}
