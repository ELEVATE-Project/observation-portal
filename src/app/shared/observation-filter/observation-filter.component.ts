import { Component } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Inject } from '@angular/core';
import { ToastService } from 'src/app/services/toast.service';

@Component({
  selector: 'app-observation-filter',
  standalone: false,
  templateUrl: './observation-filter.component.html',
  styleUrl: './observation-filter.component.css'
})
export class ObservationFilterComponent {
  allQuestions:any;
  observationType;
  constructor(public dialogRef: MatDialogRef<ObservationFilterComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private toaster:ToastService,
){
  this.allQuestions = data.allQuestions;
  this.observationType=data.observationType;
}
applyFilter(){
  let selectedQuestions = this.allQuestions.filter((q: any) => q.selected);
  if(selectedQuestions.length == 0){
    this.toaster.showToast('SELECT_ATLEAST_ONE_QUESTION', 'danger');
    return;
  }
  this.dialogRef.close(selectedQuestions);
}
resetFilter(){
  this.allQuestions.forEach((question: any) => {
    question.selected = false;
  });
}
onClose(){
  this.dialogRef.close()
}

}
