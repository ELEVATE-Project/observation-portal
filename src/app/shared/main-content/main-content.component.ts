import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-main-content',
  standalone: false,
  templateUrl: './main-content.component.html',
  styleUrl: './main-content.component.css'
})
export class MainContentComponent {
  @Input() headerConfig: any;
  @Output() searchTermChange = new EventEmitter<any>();

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

  onInputChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.headerConfig.searchTerm = input.value;
  }
  
}
