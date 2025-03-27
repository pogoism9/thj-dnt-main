import { HttpClient, HttpResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
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
import { Observable } from 'rxjs';
import { collection, collectionData, Firestore } from '@angular/fire/firestore';
@Component({
    selector: 'ariza-bank',
    imports: [CommonModule, MatListModule, MatTabsModule, MatCardModule],
    templateUrl: './bank.component.html',
    styleUrl: './bank.component.scss',
})
export class BankComponent {
    private firestore = inject(Firestore);
    private item$: Observable<any[]>;
    private _date: Date = new Date();
    private _interval: any;
    public bankData: Map<BankCategory, BankEntry[]> = new Map<BankCategory, BankEntry[]>();
    public lastModified: Date | null = null;
    public BankCategory = BankCategory;
    public PlayerClass = PlayerClass;
    public lastModifiedDisplay: string = '';

    public getClasses(category: BankCategory): PlayerClass[] {
        let base = Object.values(PlayerClass).filter((value) => typeof value === 'string') as PlayerClass[];
        if (category !== BankCategory.Epics) {
            base = base.filter((playerClass) => !['Berserker', 'Monk', 'Rogue', 'Warrior'].includes(playerClass)) as PlayerClass[];
        }
        return base;
    }
    constructor(private _http: HttpClient) {
        const itemCollection = collection(this.firestore, 'items');
        this.item$ = collectionData(itemCollection);
        this._interval = setInterval(() => {
            this._date = new Date();
            const diffInMilliseconds = this._date.getTime() - this.lastModified!.getTime();
            const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
            const diffInHours = Math.floor(diffInMilliseconds / (1000 * 60 * 60));
            const diffInDays = Math.floor(diffInMilliseconds / (1000 * 60 * 60 * 24));
            const parts: string[] = [];
            if (diffInDays > 0) {
                parts.push(`${diffInDays} days`);
            }
            if (diffInHours % 24 > 0) {
                parts.push(`${diffInHours % 24} hours`);
            }
            if (diffInMinutes % 60 > 0) {
                parts.push(`${diffInMinutes % 60} minutes`);
            }
            this.lastModifiedDisplay = `${parts.join(', ')} ago`;
        }, 1000);
    }

    ngOnDestroy(): void {
        clearInterval(this._interval);
    }
    ngOnInit(): void {
        this.item$.subscribe((rawData) => {
            rawData.forEach((itemPayload) => {
                const name = itemPayload.name;
                const data = itemPayload.data;
                const rawDate = itemPayload.date;
                const date = rawDate ? new Date(rawDate) : null;
                if (date && (!this.lastModified || this.lastModified < date)) {
                    this.lastModified = date;
                }
                // Remove the first 3 characters (dnt)
                // Split on -, get the first index ('bank' vs 'craft')
                const category = name.substring(3).split('-')[0];
                let processedData: BankEntry[] = outputFileToJson(data).sort((a, b) => a.name.localeCompare(b.name));
                const categoryEnum = Object.values(BankCategory).find(
                    (value) => value.toLowerCase() === category.toLowerCase()
                ) as BankCategory;
                this._processData(processedData, categoryEnum);
                this.bankData.set(categoryEnum, processedData);
            });
        });
    }

    private _classCategoryDataToBankEntryMap: Map<string, Map<PlayerClass, Array<BankEntry>>> = new Map<
        string,
        Map<PlayerClass, Array<BankEntry>>
    >();
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
                        const existingEntry = existingEntries.find((existingEntry) => existingEntry.id === bankEntry.id);
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
