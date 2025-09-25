import { Routes } from '@angular/router';
import { FormDemoComponent } from './pages/form-demo/form-demo';
import { PatientListComponent } from './pages/patient-list/patient-list';
import { ConsultationComponent } from './pages/consultation/consultation';
import { DoctorLoginComponent } from './pages/doctor-login/doctor-login';
import { QuickLoginComponent } from './pages/quick-login/quick-login';

export const routes: Routes = [
  { path: '', redirectTo: 'doctor-login', pathMatch: 'full' },
  { path: 'doctor-login', component: DoctorLoginComponent },
  { path: 'quick-login', component: QuickLoginComponent },
  { path: 'patients', component: PatientListComponent },
  { path: 'registration', component: FormDemoComponent },
  { path: 'consultation/:id', component: ConsultationComponent },
  { path: '**', redirectTo: 'doctor-login' }
];
