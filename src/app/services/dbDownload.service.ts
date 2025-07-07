import { Injectable } from '@angular/core';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class DbDownloadService {
  private observationDbName = 'downloads'
  private observationDbVersion = 1
  private observationStoreName = 'observation'
  private db!: IDBDatabase
  private observationDbInitialized: Promise<void>;

  constructor(
    private toaster: ToastService,
  ) {
    this.observationDbInitialized = this.initializeDownloadDb();
  }

  private initializeDownloadDb(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.observationDbName, this.observationDbVersion);
  
      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.observationStoreName)) {
          db.createObjectStore(this.observationStoreName, { keyPath: 'key' });
        }
      };
  
      request.onsuccess = (event: Event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };
  
      request.onerror = (event: Event) => {
        console.error('Error opening database:', (event.target as IDBOpenDBRequest).error);
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  }

  async addDownloadsData(data: any) {
    await this.observationDbInitialized;
    const transaction = this.db.transaction([this.observationStoreName], 'readwrite');
    const store = transaction.objectStore(this.observationStoreName);
    store.add(data);
  }

  async getDownloadsData(key: any, dbType?:any): Promise<any> {
    await this.observationDbInitialized;

  
    return new Promise((resolve, reject) => {
      try {
        
        let transaction = this.db.transaction([this.observationStoreName], 'readonly');
        let store = transaction.objectStore(this.observationStoreName);
       
        const request = store.get(key);
  
        request.onsuccess = () => {
          resolve(request.result ?? null);
        };
  
        request.onerror = () => {
          reject(request.error);
        };
      } catch (error) {
        console.error("IndexedDB transaction failed:", error);
        resolve(null);
      }
    });
  }


  async getAllDownloadsData(): Promise<any> {
    await this.observationDbInitialized;

  
    return new Promise((resolve, reject) => {
      try {
        
        let transaction = this.db.transaction([this.observationStoreName], 'readonly');
        let store = transaction.objectStore(this.observationStoreName);
       
        const request = store.getAll();
  
        request.onsuccess = () => {
          resolve(request.result ?? null);
        };
  
        request.onerror = () => {
          reject(request.error);
        };
      } catch (error) {
        console.error("IndexedDB transaction failed:", error);
        resolve(null);
      }
    });
  }
  

  updateData(data: any) {
    const transaction = this.db.transaction([this.observationStoreName], 'readwrite');
    const store = transaction.objectStore(this.observationStoreName);
    const request = store.put(data);
    request.onsuccess = (event) => {};
    request.onerror = (event) => {
      console.error('Error updating Data: ');
    };
    return
  }

  deleteData(key: any) {
    const transaction = this.db.transaction([this.observationStoreName], 'readwrite');
    const store = transaction.objectStore(this.observationStoreName);
    const request = store.delete(key);

    request.onsuccess = (event) => {
      this.toaster.showToast("Content deleted from device")
    };

    request.onerror = (event) => {
      console.error('Error deleting item: ',);
    };
  }

  // clearDb(){
  //   const transaction = this.db.transaction([this.storeName], "readwrite");
  //   const store = transaction.objectStore(this.storeName);
  //   const request = store.clear();
  //   request.onsuccess = () => {};
  //   request.onerror = (event) => {
  //     console.error("Failed to clear db");
  //   }
  // }

}