import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { GenericPopupComponent } from '../generic-popup/generic-popup.component';

@Component({
  selector: 'app-download-button',
  standalone: false,
  templateUrl: './download-button.component.html',
  styleUrls: ['./download-button.component.css']
})
export class DownloadButtonComponent {
  @Input() downloaded = false;
  @Input() messageKey = 'DOWNLOAD_MSG';
  @Output() confirmedDownload = new EventEmitter<void>();

  constructor(private dialog: MatDialog) {}

  onClick(event: Event) {
    event.stopPropagation();
    if (this.downloaded) return;

    const dialogRef = this.dialog.open(GenericPopupComponent, {
      width: '400px',
      data: { message: this.messageKey }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'yes') {
        this.confirmedDownload.emit();
      }
    });
  }

}
