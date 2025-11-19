import { Injectable } from '@angular/core';
import { ToastService } from './toast.service';
@Injectable({
  providedIn: 'root'
})
export class DbDownloadService {
  private observationDbName = 'downloads'
  private observationDbVersion = 3
  private db!: IDBDatabase
  private observationDbInitialized: Promise<void>;
  private ensureStorePromises = new Map<string, Promise<void>>();

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


  private ensureStore(storeName: string): Promise<void> {
    if (this.ensureStorePromises.has(storeName)) {
      return this.ensureStorePromises.get(storeName)!;
    }
  
    if (!this.db.objectStoreNames.contains(storeName)) {
      const version = this.db.version + 1;
      this.db.close();
      const request = indexedDB.open(this.observationDbName, version);
  
      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'key' });
        }
      };
  
      const p = new Promise<void>((resolve, reject) => {
        request.onsuccess = (event: any) => {
          this.db = event.target.result;
          this.ensureStorePromises.delete(storeName);
          resolve();
        };
        request.onerror = (event: any) => {
          this.ensureStorePromises.delete(storeName);
          reject(event.target.error);
        };
      });
  
      this.ensureStorePromises.set(storeName, p);
      return p;
    }
  
    return Promise.resolve();
  }
  

  async addDownloadsData(data: any, storeName:any) {
    await this.observationDbInitialized;
    await this.ensureStore(storeName);
    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    store.add(data);
  }

  async getDownloadsDataByKeyId(key: any, storeName:any): Promise<any> {
    await this.observationDbInitialized;
    await this.ensureStore(storeName);

  
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
    await this.ensureStore(storeName);

  
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
  
  async updateData(data: any, storeName: string) {
    await this.observationDbInitialized;
    await this.ensureStore(storeName);

    const transaction = this.db.transaction([storeName], 'readwrite');
    transaction.objectStore(storeName).put(data);
  }

  async deleteData(key: any, storeName: string) {
    await this.observationDbInitialized;
    await this.ensureStore(storeName);

    const transaction = this.db.transaction([storeName], 'readwrite');
    const request = transaction.objectStore(storeName).delete(key);

    request.onsuccess = () => this.toaster.showToast("Content deleted from device",'success');
    request.onerror = () => console.error('Error deleting item');
  }
}