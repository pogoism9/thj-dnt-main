import { HttpClient, HttpResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { outputFileToJson } from '../@shared/utils';
import { BankEntry } from '../@shared/@models/bank-entry.type';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
// import { processEpicData } from '../@shared/epic-utils';
import { PlayerClass } from '../@shared/@enums/player-class.enum';
import { epicClassMappings, itemIdToPlayerClassMap } from '../@shared/epic-utils';
import { getBaseItemId } from '../@shared/@enums/item-quality.enum';
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

    public Classes = Object.keys(PlayerClass).filter( i => isNaN(+i) );
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
                        if (name === 'epics') {
                            this._processEpicData(processedData);
                        }
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

    private _classEpicToBankEntryMap: Map<PlayerClass, Array<BankEntry>> = new Map<PlayerClass, Array<BankEntry>>();
    private _processEpicData(data: BankEntry[]): Map<PlayerClass, Array<BankEntry>> {
        // Initialize each player class with an empty array
        const _itemIdToPlayerClassMap = itemIdToPlayerClassMap();
        
        data.forEach((entry) => {
            const baseItemId = getBaseItemId(entry.id);
            const baseItemName: string = baseItemId !== entry.id ? entry.name.replace(/ \(Legendary\)| \(Enchanted\)$/, '') : entry.name; 
            

            const playerClasses = _itemIdToPlayerClassMap.get(baseItemId) || [PlayerClass.Unknown];

            playerClasses.forEach((playerClass) => {
                if (this._classEpicToBankEntryMap.has(playerClass)) {
                    const existingEntries = this._classEpicToBankEntryMap.get(playerClass);
                    if (existingEntries) {
                        const existingEntry = existingEntries.find(
                            (existingEntry) => existingEntry.id === baseItemId
                        );
                        if (existingEntry) {
                            existingEntry.count += entry.count;
                        } else {
                            existingEntries.push({
                                ...entry,
                                id: baseItemId,
                                name: baseItemName
                            });
                        }
                    }
                } else {
                    this._classEpicToBankEntryMap.set(playerClass, [
                        {
                            ...entry,
                            id: baseItemId,
                            name: baseItemName
                        },
                    ]);
                }
            });
        });

        return this._classEpicToBankEntryMap;
    }

    // Create a method that takes in a PlayerClass and returns an array of BankEntry objects
    public getEpicItemsByClass(playerClass: PlayerClass): Array<BankEntry> {
        return this._classEpicToBankEntryMap.get(playerClass) || [];
    }
}
