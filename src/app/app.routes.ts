import { Routes } from '@angular/router';
import { BankComponent } from './bank/bank.component';
import { TestComponent } from './test/test.component';

export const routes: Routes = [
    { path: 'bank', component: BankComponent },
    { path: 'test', component: TestComponent },
];
