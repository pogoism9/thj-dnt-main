export enum ItemQuality {
    Enchanted = 1000000,
    Legendary = 2000000,
}

export const getBaseItemId = (itemId: number): number => {
    // Enchanted and Legendary are increments of 1,000,000
    // Doing a modulo will return the base item ID
    return itemId % 1000000;
};