import { PlayerClass } from "../@enums/player-class.enum";

export type BankEntry = {
    location: string;
    name: string;
    id: number;
    count: number;
    slots: number;
    baseId: number;
}