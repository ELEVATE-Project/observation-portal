import { Component,Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-share-link-popup',
  standalone: false,
  templateUrl: './share-link-popup.component.html',
  styleUrl: './share-link-popup.component.css'
})
export class ShareLinkPopupComponent {
  constructor(
    public dialogRef: MatDialogRef<ShareLinkPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data:any
  ){}
  onClose() {
    this.dialogRef.close();
  }
  onCopy(){
    this.dialogRef.close(this.data)
  }
}
