export enum BankCategory {
    Items = 'Bank',
    Doze = 'Doze',
    Epics = 'Epics',
    Spells = 'Spells',
    Craft = 'Craft',
}

export const getCategory = (category: string): BankCategory => {
    return Object.values(BankCategory).find(
        (value) => value.toLowerCase() === category.toLowerCase()
    ) as BankCategory;
}