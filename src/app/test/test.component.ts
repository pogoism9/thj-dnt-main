import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { collection, collectionData, doc, Firestore, setDoc, updateDoc } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';

interface Item {
    name: string;
    description: string;
}

interface BankData {
    data: any;
}

@Component({
    selector: 'app-test',
    templateUrl: './test.component.html',
    styleUrls: ['./test.component.scss'],
    imports: [AsyncPipe, CommonModule, FormsModule],
})
export class TestComponent {
    firestore = inject(Firestore);
    item$: Observable<any[]>;
    public newItem: Item = {
        name: '',
        description: '',
    };
    constructor() {
        const itemCollection = collection(this.firestore, 'items');
        this.item$ = collectionData(itemCollection);
    }

    public async addItem() {
        await setDoc(doc(this.firestore, 'items', 'item2'), this.newItem);
        // const item = doc(this.firestore, 'items', 'item1');

        // await updateDoc(item, { ...this.newItem });
    }
    public async onFilesSelected($event: Event) {
        const input = $event.target as HTMLInputElement;
        if (input?.files?.length) {
            for (let i = 0; i < input.files.length; i++) {
                const file = input.files[i];
                console.log('File Name:', file.name);
                console.log('MIME Type:', file.type);
                console.log('File Size:', file.size, 'bytes');

                const reader = new FileReader();
                reader.onload = async () => {
                    // console.log('File Contents:', reader.result);
                    // let str: string = JSON.stringify(reader.result);
                    // str = 'test';
                    // console.log('str: ',str);
                    // const split = str.split('\n');
                    // console.log('split: ',split);
                    const bankData: BankData = {
                        data: reader.result,
                    }
                    await setDoc(doc(this.firestore, 'items', file.name), bankData);
                };
                reader.readAsText(file);    
                console.log('File Contents:', reader.result);        
            }
        }
    }
}
