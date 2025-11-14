import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
@Component({
  selector: 'app-main-content',
  standalone: false,
  templateUrl: './main-content.component.html',
  styleUrl: './main-content.component.css'
})
export class MainContentComponent implements OnInit {
  @Input() headerConfig: any;
  @Output() searchTermChange = new EventEmitter<any>();
  searchInputChanged: Subject<string> = new Subject<string>();
  searchAddEntityValue ="";

  ngOnInit(): void {
      this.searchInputChanged
      .pipe(debounceTime(800))
      .subscribe((searchValue: string) => {
        this.searchTermChange.emit(searchValue)
      });
  }

  
  clearSearch() {
    this.headerConfig.searchTerm = '';
    this.searchTermChange.emit(this.headerConfig.searchTerm);
  }

  handleKeyDown(event: KeyboardEvent) {
    const input = event.target as HTMLInputElement;
    if (event.key === 'Enter') {
      this.searchTermChange.emit(input.value)
    }
  }

  onInputChange(value: any) {
    this.headerConfig.searchTerm = value;
  }
  
}
