import { Injectable } from '@angular/core';
import { ToastService } from './toast.service';
@Injectable({
  providedIn: 'root'
})
export class DbDownloadService {
  private observationDbName = 'downloads'
  private observationDbVersion = 2
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
      
        const storeNames = [
          "observation",  
          "survey",      
          "projects"     
        ];
      
        storeNames.forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'key' });
          }
        });
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

  async addDownloadsData(data: any, storeName:any) {
    await this.observationDbInitialized;
    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    store.add(data);
  }

  async getDownloadsDataByKeyId(key: any, storeName:any): Promise<any> {
    await this.observationDbInitialized;

  
    return new Promise((resolve, reject) => {
      try {
        
        let transaction = this.db.transaction([storeName], 'readonly');
        let store = transaction.objectStore(storeName);
       
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

  async getAllDownloadsDatas(storeName:any): Promise<any> {
    await this.observationDbInitialized;

  
    return new Promise((resolve, reject) => {
      try {
        
        let transaction = this.db.transaction([storeName], 'readonly');
        let store = transaction.objectStore(storeName);
       
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
  

  updateData(data: any, storeName:any) {
    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(data);
    request.onsuccess = (event) => {};
    request.onerror = (event) => {
      console.error('Error updating Data: ');
    };
    return
  }

  deleteData(key: any, storeName:any) {
    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);

    request.onsuccess = (event) => {
      this.toaster.showToast("Content deleted from device")
    };

    request.onerror = (event) => {
      console.error('Error deleting item: ',);
    };
  }


}