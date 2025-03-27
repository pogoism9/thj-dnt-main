import { Routes } from '@angular/router';
import { BankComponent } from './bank/bank.component';
import { UploadComponent } from './upload/upload.component';

export const routes: Routes = [
    { path: 'bank', component: BankComponent },
    { path: 'upload', component: UploadComponent },
];
