import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

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
    MatDividerModule,
    MatSnackBarModule
  ],
  templateUrl: './doctor-login.html',
  styleUrls: ['./doctor-login.scss']
})
export class DoctorLoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  isSubmitting = false;

  readonly loginForm = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    remember: [true]
  });

  readonly hints: string[] = [
    '推荐使用医院统一账号登录，系统自动同步排班。',
    '首次登录后可在设置中绑定手机，提升安全性。'
  ];

  submit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.snackBar.open('请完整填写账号与密码后再登录。', '好的', {
        duration: 2800
      });
      return;
    }

    this.isSubmitting = true;

    const { username } = this.loginForm.getRawValue();

    window.setTimeout(() => {
      this.isSubmitting = false;
      this.snackBar.open(`欢迎您，${username}，已为您打开候诊患者列表。`, undefined, {
        duration: 2600
      });
      this.router.navigate(['/patients']);
    }, 600);
  }

  navigateToQuickLogin(): void {
    this.router.navigate(['/quick-login']);
  }
}
