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
import { itemIdToPlayerClassMap } from '../@shared/epic-utils';
import { spellIdToPlayerClassMap } from '../@shared/spell-utils';
import { BankCategory } from '../@shared/@enums/bank-category.enum';
@Component({
    selector: 'ariza-bank',
    imports: [CommonModule, MatListModule, MatTabsModule, MatCardModule],
    templateUrl: './bank.component.html',
    styleUrl: './bank.component.scss',
})
export class BankComponent {
    public bankData: Map<BankCategory, BankEntry[]> = new Map<BankCategory, BankEntry[]>();
    public lastModified: Date | null = null;
    public currentDateTime: Date = new Date();
    public BankCategory = BankCategory;
    public PlayerClass = PlayerClass;


    public getClasses(category: BankCategory): PlayerClass[] {
        let base = Object.values(PlayerClass).filter((value) => typeof value === 'string') as PlayerClass[];
        if (category !== BankCategory.Epics) {
            base = base.filter((playerClass) => !['Berserker', 'Monk', 'Rogue', 'Warrior'].includes(playerClass)) as PlayerClass[];
        }
        return base;
    }
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
                        const category = file.substring(3).split('-')[0]; // Remove the first 3 characters
                        const categoryEnum = Object.values(BankCategory).find(
                            (value) => value.toLowerCase() === category.toLowerCase()
                        ) as BankCategory;
                        this._processData(processedData, categoryEnum);
                        this.bankData.set(categoryEnum, processedData);
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

    private _classCategoryDataToBankEntryMap: Map<string, Map<PlayerClass, Array<BankEntry>>> = new Map<string, Map<PlayerClass, Array<BankEntry>>>();
    private _get_classCategoryDataToBankEntryMap(category: string): Map<PlayerClass, Array<BankEntry>> {
        if (this._classCategoryDataToBankEntryMap.get(category) === undefined) {
            this._classCategoryDataToBankEntryMap.set(category, new Map<PlayerClass, Array<BankEntry>>());
        }
        return this._classCategoryDataToBankEntryMap.get(category)!;
    }
    private _processData(processedData: BankEntry[], category: BankCategory = BankCategory.Epics) {
        const classDataToBankEntryMap = this._get_classCategoryDataToBankEntryMap(category);
        const classMappedData = category === BankCategory.Epics ? itemIdToPlayerClassMap() : spellIdToPlayerClassMap();
        processedData.forEach((bankEntry) => {
            const playerClasses = classMappedData.get(bankEntry.id) || classMappedData.get(bankEntry.baseId) || [PlayerClass.Unknown];
            playerClasses.forEach((playerClass) => {
                if (classDataToBankEntryMap.has(playerClass)) {
                    const existingEntries = classDataToBankEntryMap.get(playerClass);
                    if (existingEntries) {
                        const existingEntry = existingEntries.find(
                            (existingEntry) => existingEntry.id === bankEntry.id
                        );
                        if (existingEntry) {
                            existingEntry.count += bankEntry.count;
                        } else {
                            existingEntries.push(bankEntry);
                        }
                    }
                } else {
                    classDataToBankEntryMap.set(playerClass, [bankEntry]);
                }
            });
        });
    }

    public getDataByClass(playerClass: PlayerClass, category: BankCategory = BankCategory.Epics): Array<BankEntry> {
        return this._classCategoryDataToBankEntryMap.get(category)?.get(playerClass) || [];
    }

    public getCategoryItemsByClass(playerClass: PlayerClass, category: BankCategory = BankCategory.Epics): Array<BankEntry> {
        return this.getDataByClass(playerClass, category);
    }
    
}
