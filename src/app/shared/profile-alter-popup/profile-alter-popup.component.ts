import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-profile-alter-popup',
  standalone: false,
  templateUrl: './profile-alter-popup.component.html',
  styleUrls: ['./profile-alter-popup.component.css']
})
export class ProfileAlterPopupComponent {
  constructor(  public dialogRef: MatDialogRef<ProfileAlterPopupComponent>,@Inject(MAT_DIALOG_DATA) public data: any){}

  closeDialog(data:any){
    this.dialogRef.close(data)
  }

}
