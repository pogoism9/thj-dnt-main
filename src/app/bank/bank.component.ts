import { HttpClient, HttpResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { outputFileToJson } from '../@shared/utils';
import { BankEntry } from '../@shared/@models/bank-entry.type';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
@Component({
    selector: 'ariza-bank',
    imports: [CommonModule, MatListModule, MatTabsModule, MatCardModule],
    templateUrl: './bank.component.html',
    styleUrl: './bank.component.scss',
})
export class BankComponent {
    public bankData: Map<string, BankEntry[]> = new Map<string, BankEntry[]>();
    public lastModified: Date | null = null;
    public currentDateTime: Date = new Date();
    constructor(private _http: HttpClient) {}

    ngOnInit(): void {
        const targetFiles = [
            'Dntbank-Inventory.txt',
            'Dntdoze-Inventory.txt',
            'Dntepics-Inventory.txt',
            'Dntspells-Inventory.txt',
        ];

        targetFiles.forEach((file) => {
            this._http
                .get(`assets/${file}`, {
                    responseType: 'text',
                    observe: 'response',
                })
                .subscribe((response: HttpResponse<string>) => {
                    const data = response.body;
                    const fileLastModified =
                        response.headers.get('Last-Modified');

                    if (data) {
                        let processedData: BankEntry[] = outputFileToJson(data);
                        processedData = processedData.sort((a, b) =>
                            a.name.localeCompare(b.name)
                        );
                        const name = file.substring(3).split('-')[0]; // Remove the first 3 characters
                        this.bankData.set(name, processedData);
                    }

                    if (fileLastModified) {
                        if (
                            this.lastModified === null ||
                            this.lastModified < new Date(fileLastModified)
                        ) {
                            this.lastModified = new Date(fileLastModified);
                        }
                    }
                });
        });
    }
}
