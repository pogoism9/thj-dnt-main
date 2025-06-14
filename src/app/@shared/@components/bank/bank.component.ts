import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { BankEntry } from '@models/bank-entry.type';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { BehaviorSubject, interval, Observable, Subscription, combineLatest } from 'rxjs';
import { Firestore } from '@angular/fire/firestore';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, map } from 'rxjs/operators';
import { getDisplayDeltaFromDate, itemIdToPlayerClassMap, spellIdToPlayerClassMap, outputFileToJson, augSources} from '@utils/index';
import { BankCategory, getCategory, ItemSlot, PlayerClass, AugSourceEnum } from '@enums/index';
import { ItemIdsByClass } from '@interfaces/itemIds-by-class.interface';
import itemIdsByClassJson from '../../../../assets/item-ids-by-class.json';

const itemIdsByClass: ItemIdsByClass = itemIdsByClassJson;

interface FilterStates {
    hideNormal: boolean;
    hideEnchanted: boolean;
    hideLegendary: boolean;
}

@Component({
    selector: 'ariza-bank',
    imports: [
        CommonModule,
        MatListModule,
        MatTabsModule,
        MatCardModule,
        FormsModule,
        MatFormFieldModule,
        MatInputModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatCheckboxModule
    ],
    templateUrl: './bank.component.html',
    styleUrl: './bank.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BankComponent {
    
    private _searchText$ = new BehaviorSubject<string>('');
    private searchSubscription: Subscription | undefined;
    
    // Filter states for checkboxes
    private _filterStates$ = new BehaviorSubject<FilterStates>({
        hideNormal: false,
        hideEnchanted: false,
        hideLegendary: false,
    });
    public filterStates$ = this._filterStates$.asObservable();

    // Available filter options for the template
    public availableFilters = [
        { key: 'hideNormal' as keyof FilterStates, label: 'Hide Normal' },
        { key: 'hideEnchanted' as keyof FilterStates, label: 'Hide Enchanted' },
        { key: 'hideLegendary' as keyof FilterStates, label: 'Hide Legendary' }
    ];

    onSearchChange($event: Event) {
        const input = $event.target as HTMLInputElement;
        const value = input.value;
        this._searchText$.next(value);
    }

    // Methods for filter buttons
    isFilterSelected(filterKey: keyof FilterStates): boolean {
        return this._filterStates$.value[filterKey];
    }

    toggleFilter(filterKey: keyof FilterStates): void {
        const currentFilters = this._filterStates$.value;
        const updatedFilters = {
            ...currentFilters,
            [filterKey]: !currentFilters[filterKey]
        };
        this._filterStates$.next(updatedFilters);
    }

    onFilterChange(filterType: keyof FilterStates, event: MatCheckboxChange): void {
        const currentFilters = this._filterStates$.value;
        const updatedFilters = {
            ...currentFilters,
            [filterType]: event.checked
        };
        this._filterStates$.next(updatedFilters);
    }

    private firestore = inject(Firestore);
    @Input() items: Observable<any[]> = new Observable<any[]>();

//#region Class Filter
    private _selectedClasses$ = new BehaviorSubject<Set<string>>(new Set(['All']));
    public selectedClasses$ = this._selectedClasses$.asObservable();
    
    public availableClasses: string[] = [
        ...Object.values(PlayerClass),
        'All'
    ].filter(ac => ac !== 'Unknown');
    
    public toggleClass(className: string): void {
        const currentSelection = new Set(this._selectedClasses$.value);
        
        if (className === 'All') {
            // If All is clicked, select only All
            currentSelection.clear();
            currentSelection.add('All');
        } else {
            // Remove 'All' if it's selected
            currentSelection.delete('All');
            
            // Toggle the specific class
            if (currentSelection.has(className)) {
                currentSelection.delete(className);
            } else {
                currentSelection.add(className);
            }
            
            // If no classes are selected, default to 'All'
            if (currentSelection.size === 0) {
                currentSelection.add('All');
            }
        }
        
        this._selectedClasses$.next(currentSelection);
        
        // Re-initialize bank data with current search term and class filter
        const currentSearchTerm = this._searchText$.value;
        this.resetValues();
        this.initializeBankData(currentSearchTerm);
    }
    
    public isClassSelected(className: string): boolean {
        return this._selectedClasses$.value.has(className);
    }
    
    private shouldIncludeItem(itemId: number): boolean {
        const selectedClasses = this._selectedClasses$.value;
        
        // If 'All' is selected, include all items
        if (selectedClasses.has('All')) {
            return true;
        }
        if (itemIdsByClass['All'].includes(itemId)) {
            return true;
        }
        
        // Check if the item belongs to any of the selected classes
        for (const className of selectedClasses) {
            const classKey = className as keyof ItemIdsByClass;
            if (itemIdsByClass[classKey] && itemIdsByClass[classKey].includes(itemId)) {
                return true;
            }
        }
        
        return false;
    }
    //#endregion

    //#region Bank Data
    private _bankData$: BehaviorSubject<Map<BankCategory, BankEntry[]>> = new BehaviorSubject<Map<BankCategory, BankEntry[]>>(
        new Map<BankCategory, BankEntry[]>()
    );
    public bankData$: Observable<Map<BankCategory, BankEntry[]>> = this._bankData$.asObservable();
    //#endregion

    //#region lastModified
    private lastModifiedSubscription: Subscription;

    // Tracks the last modified date of the uploaded files
    private lastModified: Date | null = null;
    private readonly _lastModifiedDisplay$: BehaviorSubject<string> = new BehaviorSubject<string>('');
    public lastModifiedDisplay$: Observable<string> = this._lastModifiedDisplay$.asObservable();
    //#endregion

    /**
     * Enums for reference in the template
     */
    //#region Enums
    public BankCategory = BankCategory;
    public PlayerClass = PlayerClass;
    public ItemSlot = ItemSlot;
    public AugSource = AugSourceEnum;
    //#endregion

    public Object = Object;
    private _itemSlots$: BehaviorSubject<ItemSlot[]> = new BehaviorSubject<ItemSlot[]>([]);
    public itemSlots$: Observable<ItemSlot[]> = this._itemSlots$.asObservable();

    public _classesMap$: BehaviorSubject<Map<BankCategory, PlayerClass[]>> = new BehaviorSubject<Map<BankCategory, PlayerClass[]>>(
        new Map<BankCategory, PlayerClass[]>()
    );
    public classesMap$: Observable<Map<BankCategory, PlayerClass[]>> = this._classesMap$.asObservable();

    private _playerClasses: PlayerClass[] = Object.values(PlayerClass).filter((value) => typeof value === 'string') as PlayerClass[];

    // Aug Source related properties
    private _augSources$: BehaviorSubject<AugSourceEnum[]> = new BehaviorSubject<AugSourceEnum[]>([]);
    public augSources$: Observable<AugSourceEnum[]> = this._augSources$.asObservable();

    private _augSourceBankEntryMap$ = new BehaviorSubject<Map<AugSourceEnum, BankEntry[]>>(new Map<AugSourceEnum, BankEntry[]>());
    public augSourceBankEntryMap$ = this._augSourceBankEntryMap$.asObservable();

    // Add this computed observable for easier template binding
    public augSourceItems$ = combineLatest([
        this.augSources$,
        this.augSourceBankEntryMap$
    ]).pipe(
        map(([sources, sourceMap]) => 
            sources.map(source => ({
                source,
                items: sourceMap.get(source) || []
            }))
        )
    );

    // Helper method for template
    public getItemsForSource(source: AugSourceEnum, map: Map<AugSourceEnum, BankEntry[]> | null): BankEntry[] {
        return map?.get(source) || [];
    }

private getAugSourceFromItem(item: BankEntry): AugSourceEnum {
    const itemId = item.id.toString();

    // Loop through our mappings to find the first match.
    for (const mapping of augSources.sourceMappings) {
        if (mapping.ids.some(idFromList => itemId.includes(idFromList.toString()))) {
            // As soon as we find a match, return the corresponding source and exit.
            return mapping.source;
        }
    }

    // If the loop completes without finding any matches, return the default.
    return AugSourceEnum.Other;
}

    public getClasses(category: BankCategory): PlayerClass[] {
        let playerClasses = this._playerClasses;
        if (category !== BankCategory.Epics) {
            playerClasses = playerClasses.filter(
                (playerClass) => !['Berserker', 'Monk', 'Rogue', 'Warrior'].includes(playerClass)
            ) as PlayerClass[];
        }

        return playerClasses;
    }

    private _itemSlotBankEntryMap$ = new BehaviorSubject<Map<ItemSlot, BankEntry[]>>(new Map<ItemSlot, BankEntry[]>());
    public itemSlotBankEntryMap$ = this._itemSlotBankEntryMap$.asObservable();

    constructor() {
        this.lastModifiedSubscription = interval(1000).subscribe(() => {
            if (this.lastModified) {
                const displayDeltaFromDate = getDisplayDeltaFromDate(this.lastModified);
                this._lastModifiedDisplay$.next(displayDeltaFromDate);
            }
        });
    }

    private resetValues = () => {
        this._itemSlots$.next((Object.values(ItemSlot).filter((value) => typeof value === 'number') as ItemSlot[]).sort((a, b) =>
            ItemSlot[a].localeCompare(ItemSlot[b])));
        
        // Add aug sources initialization
        this._augSources$.next(Object.values(AugSourceEnum));
        
        this._classCategoryDataToBankEntryMap = new Map<BankCategory, Map<PlayerClass | ItemSlot, Array<BankEntry>>>();
    };

    ngOnDestroy(): void {
        if (this.lastModifiedSubscription) {
            this.lastModifiedSubscription.unsubscribe();
        }
        if (this.searchSubscription) {
            this.searchSubscription.unsubscribe();
        }
    }

    ngOnInit(): void {
        // Existing initialization code
        console.log('BankComponent initialized');

        // Initialize our classMap
        this._classesMap$.next(
            new Map<BankCategory, PlayerClass[]>([
                [BankCategory.Epics, this.getClasses(BankCategory.Epics)],
                [BankCategory.Items, this.getClasses(BankCategory.Items)],
                [BankCategory.Spells, this.getClasses(BankCategory.Spells)],
                [BankCategory.Augs, this.getClasses(BankCategory.Augs)],
            ])
        );

        // Initialize our bankData$
        this.initializeBankData();

        // Combine search text and filter states to trigger data updates
        this.searchSubscription = combineLatest([
            this._searchText$.pipe(debounceTime(500), distinctUntilChanged()),
            this._filterStates$
        ])
            .pipe(
                switchMap(([searchTerm, filterStates]) => {
                    this.resetValues();
                    this.initializeBankData(searchTerm, filterStates);
                    return this.bankData$;
                })
            )
            .subscribe(() => {});
    }

    public initializeBankData(filter: string | null = null, filterStates: FilterStates | null = null): void {
        // Initialize our bankData$
        let hasProcessedSharedBank = false;
        this.items.subscribe((rawData) => {
            this._classCategoryDataToBankEntryMap.clear();
            const bankData = new Map<BankCategory, BankEntry[]>();

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
                let processedData: BankEntry[] = outputFileToJson(data, filter, hasProcessedSharedBank)
                    .filter(item => this.shouldIncludeItem(item.id))
                    .sort((a, b) => a.name.localeCompare(b.name));
                
                // Apply filter states if provided
                if (filterStates) {
                    processedData = this.applyFilterStates(processedData, filterStates);
                }
                
                hasProcessedSharedBank = true;
                const categoryEnum = getCategory(category);
                this._processData(processedData, categoryEnum);
                bankData.set(categoryEnum, processedData);
            });
            this._bankData$.next(bankData);
        });
    }

    private applyFilterStates(data: BankEntry[], filterStates: FilterStates): BankEntry[] {
        return data.filter(item => {
            // Assuming BankEntry has a property that indicates rarity/type
            // You'll need to adjust these conditions based on your actual BankEntry structure
            
            // Example logic - adjust based on your actual item structure:
            const itemRarity = this.getItemRarity(item); // You'll need to implement this method
            
            if (filterStates.hideNormal && itemRarity === 'normal') return false;
            if (filterStates.hideEnchanted && itemRarity === 'enchanted') return false;
            if (filterStates.hideLegendary && itemRarity === 'legendary') return false;
            
            return true;
        });
    }

    private getItemRarity(item: BankEntry): string {
        if (item.id >= 2000000) {
            return 'legendary';
        } else if (item.id >= 1000000) {
            return 'enchanted';
        } else {
            return 'normal';
        }
    }

    private _classCategoryDataToBankEntryMap$: BehaviorSubject<Map<BankCategory, Map<PlayerClass | ItemSlot, Array<BankEntry>>>> =
        new BehaviorSubject<Map<BankCategory, Map<PlayerClass | ItemSlot, Array<BankEntry>>>>(
            new Map<BankCategory, Map<PlayerClass | ItemSlot, Array<BankEntry>>>()
        );

    public classCategoryDataToBankEntryMap$ = this._classCategoryDataToBankEntryMap$.asObservable();

    // TODO: Remove this and use Observables instead
    private _classCategoryDataToBankEntryMap: Map<BankCategory, Map<PlayerClass | ItemSlot, Array<BankEntry>>> = new Map<
        BankCategory,
        Map<PlayerClass | ItemSlot, Array<BankEntry>>
    >();
    
    private _get_classCategoryDataToBankEntryMap(category: BankCategory): Map<PlayerClass | ItemSlot, Array<BankEntry>> {
        if (!this._classCategoryDataToBankEntryMap.has(category)) {
            this._classCategoryDataToBankEntryMap.set(category, new Map<PlayerClass, Array<BankEntry>>());
        }
        return this._classCategoryDataToBankEntryMap.get(category)!;
    }

    private _processData(processedData: BankEntry[], category: BankCategory = BankCategory.Epics): void {
        // Special post processing for Epics and Spells
        if ([BankCategory.Epics, BankCategory.Spells].includes(category)) {
            // classDataToBankEntryMap
            const map: Map<PlayerClass | ItemSlot, Array<BankEntry>> = this._get_classCategoryDataToBankEntryMap(category);

            const classMappedData = category === BankCategory.Epics ? itemIdToPlayerClassMap() : spellIdToPlayerClassMap();
            processedData.forEach((bankEntry) => {
                const playerClasses = classMappedData.get(bankEntry.id) || classMappedData.get(bankEntry.baseId) || [PlayerClass.Unknown];
                playerClasses.forEach((playerClass) => {
                    if (map.has(playerClass)) {
                        const existingEntries = map.get(playerClass)!;
                        const existingEntry = existingEntries.find((existingEntry) => existingEntry.id === bankEntry.id);
                        if (existingEntry) {
                            existingEntry.count += bankEntry.count;
                        } else {
                            existingEntries.push(bankEntry);
                        }
                    } else {
                        map.set(playerClass, [bankEntry]);
                    }
                });
            });

            this._classCategoryDataToBankEntryMap$.next(this._classCategoryDataToBankEntryMap);
        } else if (category === BankCategory.Items) {
            const _itemSlots = Object.values(ItemSlot).filter((value) => typeof value === 'number') as ItemSlot[];

            const itemSlotBankEntryMap: Map<ItemSlot, BankEntry[]> = new Map<ItemSlot, BankEntry[]>(
                _itemSlots.map((slot) => [slot, processedData.filter((item) => (slot === 0 && item.itemSlot === 0) || (item.itemSlot & slot) !== 0)])
            );

            this._itemSlots$.next(this._itemSlots$.value.filter((slot) => itemSlotBankEntryMap.get(slot)?.length));

            this._itemSlotBankEntryMap$.next(itemSlotBankEntryMap);

            const map: Map<PlayerClass | ItemSlot, Array<BankEntry>> = this._get_classCategoryDataToBankEntryMap(category);
            processedData.forEach((bankEntry) => {
                const itemSlot = bankEntry.itemSlot;
                if (map.has(itemSlot)) {
                    const existingEntries: BankEntry[] = map.get(itemSlot)!;
                    const existingEntry = existingEntries.find((existingEntry) => existingEntry.id === bankEntry.id);
                    if (existingEntry) {
                        existingEntry.count += bankEntry.count;
                    } else {
                        existingEntries.push(bankEntry);
                    }
                } else {
                    map.set(itemSlot, [bankEntry]);
                }
            });
            this._classCategoryDataToBankEntryMap$.next(this._classCategoryDataToBankEntryMap);
        } else if (category === BankCategory.Augs) {
            // NEW: Handle Augs category grouped by AugSource
            const augSources = Object.values(AugSourceEnum);
            
            const augSourceBankEntryMap: Map<AugSourceEnum, BankEntry[]> = new Map<AugSourceEnum, BankEntry[]>();
            
            // Initialize map with all sources
            augSources.forEach(source => {
                augSourceBankEntryMap.set(source, []);
            });
            
            // Group items by their aug source
            processedData.forEach((bankEntry) => {
                const augSource = this.getAugSourceFromItem(bankEntry);
                const existingEntries = augSourceBankEntryMap.get(augSource) || [];
                const existingEntry = existingEntries.find((existingEntry) => existingEntry.id === bankEntry.id);
                
                if (existingEntry) {
                    existingEntry.count += bankEntry.count;
                } else {
                    existingEntries.push(bankEntry);
                }
                
                augSourceBankEntryMap.set(augSource, existingEntries);
            });

            // Filter out empty sources and update observables
            const filteredSources = augSources.filter(source => 
                augSourceBankEntryMap.get(source)?.length! > 0
            );
            
            this._augSources$.next(filteredSources);
            this._augSourceBankEntryMap$.next(augSourceBankEntryMap);
            
            // Also update the classCategoryDataToBankEntryMap for consistency
            const map: Map<PlayerClass | ItemSlot, Array<BankEntry>> = this._get_classCategoryDataToBankEntryMap(category);
            processedData.forEach((bankEntry) => {
                const augSource = this.getAugSourceFromItem(bankEntry) as any; // Cast to match the union type
                if (map.has(augSource)) {
                    const existingEntries: BankEntry[] = map.get(augSource)!;
                    const existingEntry = existingEntries.find((existingEntry) => existingEntry.id === bankEntry.id);
                    if (existingEntry) {
                        existingEntry.count += bankEntry.count;
                    } else {
                        existingEntries.push(bankEntry);
                    }
                } else {
                    map.set(augSource, [bankEntry]);
                }
            });
            this._classCategoryDataToBankEntryMap$.next(this._classCategoryDataToBankEntryMap);
        }
    }
}