import { Routes } from '@angular/router';
import { AllTask } from './all-task/all-task';
import { Ekle } from './ekle/ekle';
import { Edit } from './edit/edit';
import { UserTasks } from './user-tasks/user-tasks';
import { UserManagement } from './user-management/user-management';
import { ManagerPanelComponent } from './manager-panel/manager-panel';
import { Login } from './login/login';
import { AdminGuard, UserGuard, AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  // Default redirect - login sayfası
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  
  // Login sayfası (herkese açık)
  { path: 'login', component: Login },
  
  // Director only routes (eski Admin)
  { 
    path: 'all-tasks', 
    component: AllTask, 
    canActivate: [AdminGuard],
    data: { role: 'DIRECTOR' }
  },
  { 
    path: 'add-task', 
    component: Ekle, 
    canActivate: [AdminGuard],
    data: { role: 'DIRECTOR' }
  },
  { 
    path: 'edit-task/:id', 
    component: Edit, 
    canActivate: [AdminGuard],
    data: { role: 'DIRECTOR' }
  },
  { 
    path: 'user-management', 
    component: UserManagement, 
    canActivate: [AdminGuard],
    data: { role: 'DIRECTOR' }
  },
  
  // Manager only routes
  { 
    path: 'manager-panel', 
    component: ManagerPanelComponent,
    canActivate: [AuthGuard],
    data: { role: 'MANAGER' }
  },
  
  // User Tasks - Manager ve Team Member için
  { 
    path: 'user-tasks', 
    component: UserTasks, 
    canActivate: [UserGuard] // Manager + Team Member
  },
  
  // Catch all redirect
  { path: '**', redirectTo: '/login' }
];
