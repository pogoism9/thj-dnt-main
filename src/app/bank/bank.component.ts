import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { outputFileToJson } from '../@shared/utils';
import { BankEntry } from '../@shared/@models/bank-entry.type';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ariza-bank',
  imports: [CommonModule],
  templateUrl: './bank.component.html',
  styleUrl: './bank.component.scss'
})
export class BankComponent {
    public bankData: BankEntry[] = [];
    constructor(private _http: HttpClient) {}

    ngOnInit(): void {
        this._http.get('assets/Dntspells-Inventory.txt', {responseType: 'text'}).subscribe(data => {
            let bankData: BankEntry[] = outputFileToJson(data);
            bankData = bankData.sort((a, b) => a.name.localeCompare(b.name));
            this.bankData = bankData;
        });
    }
}
