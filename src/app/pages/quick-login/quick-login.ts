import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-quick-login',
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
    MatSnackBarModule,
    MatSelectModule,
    MatDividerModule
  ],
  templateUrl: './quick-login.html',
  styleUrls: ['./quick-login.scss']
})
export class QuickLoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly rooms: string[] = ['一诊室', '二诊室', '急诊抢救室'];

  readonly quickForm = this.fb.group({
    doctor: ['', [Validators.required, Validators.minLength(2)]],
    accessCode: ['', [Validators.required, Validators.minLength(4)]],
    patientId: ['', [Validators.required]],
    room: [this.rooms[0], Validators.required]
  });

  submit(): void {
    if (this.quickForm.invalid) {
      this.quickForm.markAllAsTouched();
      this.snackBar.open('请完整填写快速登录信息。', '好的', {
        duration: 2600
      });
      return;
    }

    const { doctor, patientId } = this.quickForm.getRawValue();
    const normalizedDoctor = doctor?.trim() || '值班医生';
    const normalizedPatient = patientId?.trim() || 'P20241001';

    this.snackBar.open(`已为 ${normalizedDoctor} 医生调取 ${normalizedPatient} 的看诊界面。`, undefined, {
      duration: 2400
    });

    this.router.navigate(['/consultation', normalizedPatient]);
  }

  backToPatients(): void {
    this.router.navigate(['/patients']);
  }

  fillDemo(): void {
    this.quickForm.patchValue({
      doctor: '李主任',
      accessCode: '6895',
      patientId: 'P20241002'
    });
  }
}
