import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-generic-dialog',
  standalone: false,
  templateUrl: './generic-dialog.component.html',
  styleUrl: './generic-dialog.component.css'
})
export class GenericDialogComponent {
  constructor(  public dialogRef: MatDialogRef<GenericDialogComponent>,@Inject(MAT_DIALOG_DATA) public data: any){}

  closeDialog(data:any){
    this.dialogRef.close(data)
  }
}
