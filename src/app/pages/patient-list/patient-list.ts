import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

interface PatientSummary {
  id: string;
  name: string;
  gender: '男' | '女';
  age: number;
  dept: string;
  doctor: string;
  status: '候诊' | '就诊中' | '已就诊';
  tags: string[];
}

@Component({
  selector: 'app-patient-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './patient-list.html',
  styleUrls: ['./patient-list.scss']
})
export class PatientListComponent {
  private router = inject(Router);

  searchTerm = '';

  readonly patients: PatientSummary[] = [
    {
      id: 'P20241001',
      name: '张伟',
      gender: '男',
      age: 42,
      dept: '心内科',
      doctor: '李主任',
      status: '候诊',
      tags: ['高血压', '二级随访']
    },
    {
      id: 'P20241002',
      name: '王芳',
      gender: '女',
      age: 35,
      dept: '呼吸内科',
      doctor: '周医生',
      status: '就诊中',
      tags: ['哮喘']
    },
    {
      id: 'P20241003',
      name: '刘强',
      gender: '男',
      age: 58,
      dept: '内分泌科',
      doctor: '陈医生',
      status: '候诊',
      tags: ['糖尿病', '定期复查']
    },
    {
      id: 'P20241004',
      name: '赵敏',
      gender: '女',
      age: 27,
      dept: '妇产科',
      doctor: '王主任',
      status: '已就诊',
      tags: ['产检']
    }
  ];

  get filteredPatients(): PatientSummary[] {
    if (!this.searchTerm.trim()) {
      return this.patients;
    }
    const keyword = this.searchTerm.trim().toLowerCase();
    return this.patients.filter((patient) => {
      return (
        patient.name.toLowerCase().includes(keyword) ||
        patient.id.toLowerCase().includes(keyword) ||
        patient.dept.toLowerCase().includes(keyword) ||
        patient.doctor.toLowerCase().includes(keyword)
      );
    });
  }

  navigateToRegistration(): void {
    this.router.navigate(['/registration']);
  }

  openConsultation(patient: PatientSummary): void {
    this.router.navigate(['/consultation', patient.id]);
  }
}
