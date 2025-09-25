import { Routes } from '@angular/router';
import { FormDemoComponent } from './pages/form-demo/form-demo';
import { PatientListComponent } from './pages/patient-list/patient-list';
import { ConsultationComponent } from './pages/consultation/consultation';

export const routes: Routes = [
  { path: '', redirectTo: 'patients', pathMatch: 'full' },
  { path: 'patients', component: PatientListComponent },
  { path: 'registration', component: FormDemoComponent },
  { path: 'consultation/:id', component: ConsultationComponent },
  { path: '**', redirectTo: 'patients' }
];
