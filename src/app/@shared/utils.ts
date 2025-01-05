import { BankEntry } from "./@models/bank-entry.type";

export function outputFileToJson(rawData: string): BankEntry[] {
    // Split the raw data by new lines
    const lines = rawData.split("\n");

    // Define an array to store the results
    const result: BankEntry[] = [];

    const blacklistedItemIds = [ 
        17005, // Backpack
        17423, // Adventurer's Pack
        976012, // Large Bank Box
    ]

    const blacklistedItemLocations = [
        'Primary',
        'Chest',
    ]

    // Iterate through each line
    for (let i = 1; i < lines.length; i++) {  // Skip the first line (headers)
        const line = lines[i].trim();

        // Skip empty lines
        if (line === "") continue;

        // Split the line by tabs or spaces
        const columns = line.split(/\s{2,}|\t/);  // Match any number of spaces or tab

        // Ensure the line has the expected number of columns
        if (columns.length === 5) {
            const [location, name, id, count, slots] = columns;
            if (+id === 0 || 
                blacklistedItemIds.includes(+id) ||
                blacklistedItemLocations.includes(location)
            ) 
                continue;
            

            const bankEntry: BankEntry = {
                location,
                name,
                id: +id,
                count: +count,
                slots: +slots
            };

            result.push(bankEntry);
        }
    }
    return result;
}