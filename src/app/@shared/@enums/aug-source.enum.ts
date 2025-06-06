export enum AugSource {
    Veeshans = 'Veeshan\'s Peak',
    Sleepers = 'The Sleeper\'s Tomb',
    Seru = 'Sanctus Seru',
    Zeb = 'The Plane of Time',
    Other = 'Other',
   
}

export const getSource = (category: string): AugSource => {
    return Object.values(AugSource).find(
        (value) => value.toLowerCase() === category.toLowerCase()
    ) as AugSource;
}