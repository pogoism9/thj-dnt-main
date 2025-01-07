import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { outputFileToJson } from '../@shared/utils';
import { BankEntry } from '../@shared/@models/bank-entry.type';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatTabsModule } from '@angular/material/tabs';
@Component({
  selector: 'ariza-bank',
  imports: [
    CommonModule,
    MatListModule,
    MatTabsModule
  ],
  templateUrl: './bank.component.html',
  styleUrl: './bank.component.scss'
})
export class BankComponent {
    
    public bankData: Map<string, BankEntry[]> = new Map<string, BankEntry[]>();

    constructor(private _http: HttpClient) {}

    ngOnInit(): void {
        const targetFiles = [
            'Dntbank-Inventory.txt',
            'Dntdoze-Inventory.txt',
            'Dntepics-Inventory.txt',
            'Dntspells-Inventory.txt',
        ];

        targetFiles.forEach(file => {
            this._http.get(`assets/${file}`, {responseType: 'text'}).subscribe(data => {
                let processedData: BankEntry[] = outputFileToJson(data);

                processedData = processedData.sort((a, b) => a.name.localeCompare(b.name));
                const name = file.split('-')[0].substring(3);
                this.bankData.set(name, processedData);
            });
        });
    }
}
