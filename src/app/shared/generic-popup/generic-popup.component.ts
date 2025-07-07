import { Component,Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface ConfirmDialogData {
  title: string;
  message: string;
  entityType?: string;
  yesLabel?: string;
  noLabel?: string;
}

@Component({
  selector: 'app-generic-popup',
  standalone: false,
  templateUrl: './generic-popup.component.html',
  styleUrl: './generic-popup.component.css'
})
export class GenericPopupComponent {
  yesLabel: string;
  noLabel: string;
  
  constructor(
    public dialogRef: MatDialogRef<GenericPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {
    this.yesLabel = data.yesLabel || 'YES';
    this.noLabel = data.noLabel || 'NO';
  }

  onClose(result: string) {
    this.dialogRef.close(result);
  }
}
