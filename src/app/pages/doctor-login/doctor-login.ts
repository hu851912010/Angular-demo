import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { DoctorLoginFlowService } from '../../services/doctor-login-flow.service';

@Component({
  selector: 'app-doctor-login',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatCheckboxModule,
    MatSnackBarModule,
    MatDividerModule
  ],
  templateUrl: './doctor-login.html',
  styleUrls: ['./doctor-login.scss']
})
export class DoctorLoginComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly loginFlow = inject(DoctorLoginFlowService);

  /** 是否隐藏密码，保障账号安全。 */
  hidePassword = true;
  /** 登录提交中标志，用于控制按钮 loading 状态。 */
  isSubmitting = false;

  /**
   * 登录提示语，帮助医护人员快速了解产品能力。
   */
  readonly hints: string[] = [
    '统一账号由信息中心维护，如忘记密码可通过自助终端找回。',
    '首次登录建议开启「记住账号」以提升诊间效率。'
  ];

  /**
   * 登录表单，仅承载账号密码与记住账号配置。
   */
  readonly loginForm = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    remember: [true]
  });

  ngOnInit(): void {
    // 每次进入账号验证页时都清理上一次的登录流程，避免残留权限数据。
    this.loginFlow.clearSession();
  }

  /**
   * 执行账号密码校验，通过后跳转至权限选择页面。
   */
  submit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.snackBar.open('请先完整填写账号与密码。', '我知道了', {
        duration: 2800
      });
      return;
    }

    this.isSubmitting = true;
    const { username, password, remember } = this.loginForm.getRawValue();

    window.setTimeout(() => {
      const profile = this.loginFlow.authenticate(username ?? '', password ?? '', !!remember);
      this.isSubmitting = false;

      if (!profile) {
        this.snackBar.open('账号或密码有误，请重新输入。', '重试', {
          duration: 3000
        });
        this.loginForm.controls.password.reset('');
        return;
      }

      this.snackBar.open(`欢迎您，${profile.displayName}医生，请继续选择登录场景。`, undefined, {
        duration: 2600
      });
      this.router.navigate(['/doctor-login/context']);
    }, 500);
  }

  /**
   * 提供快速通道给体验账号使用者，减少阻碍。
   */
  navigateToQuickLogin(): void {
    this.router.navigate(['/quick-login']);
  }
}
