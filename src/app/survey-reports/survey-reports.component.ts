import { Component, OnInit } from '@angular/core';
import * as urlConfig from '../constants/url-config.json';
import { ApiService } from '../services/api.service';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { SurveyFilterComponent } from '../shared/survey-filter/survey-filter.component';
import { SurveyPreviewComponent } from '../shared/survey-preview/survey-preview.component';
import { UtilsService } from '../services/utils.service';
import { ReportsService } from '../services/reports.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-survey-reports',
  standalone: false,
  templateUrl: './survey-reports.component.html',
  styleUrl: './survey-reports.component.css'
})
export class SurveyReportsComponent implements OnInit {
  reportDetails!: any;
  objectURL: any;
  isModalOpen: boolean = false;
  isFilterModalOpen: boolean = false;
  filteredQuestions: any;
  allQuestions: any[] = [];
  surveyName!: string;
  objectKeys = Object.keys;
  submissionId: any;
  solutionId:any;
  pdf:any=false;
  loaded:any=false;

  constructor(
    private apiService: ApiService,
    private dialog: MatDialog,
    private router:ActivatedRoute, 
    private utils:UtilsService,
    public route: Router,
    private reports:ReportsService
  ) {}

  ngOnInit() {
    this.router.params.subscribe(param => {
      this.submissionId = param['id'];
      this.solutionId=param['solutionId']
      this.loaded=false;
      this.apiService.post(urlConfig.survey.reports+`${this.submissionId}`,{}).pipe(finalize(()=>this.loaded = true))
      .subscribe((res:any) => { 
        this.surveyName = res.message.surveyName
        this.allQuestions = res.message.report;
        this.reportDetails = this.processSurveyData(this.allQuestions).map(item => {
          if (item?.evidences?.length) {
            return {
              ...item,
              evidences: this.utils.mapEvidences(item.evidences)
            };
          }
          return item;
        });
      })
    })
  
  }
  surveyReportPdf(type:any){
    this.apiService.post(urlConfig.survey.reports+`${this.submissionId}&pdf=true`,{})
    .subscribe(async (res:any) => { 
      if(type === 'download'){
        await this.openUrl(res?.message?.pdfLink);
        return;
      }
      await this.reports.shareReport(res?.message?.pdfLink,'survey')
    });
  }

  processSurveyData(data: any[]): any[] {
    const mapAnswersToLabels = (answers: any[], optionsAvailable: any[]) => {
      return answers.map((answer: any) => {
        if (typeof answer === 'number') {
          return answer;
        }
  
        const trimmedAnswer = answer.trim();
        if (trimmedAnswer === '') {
          return 'No response is available'; 
        }
  
        const option = optionsAvailable?.find((opt: { value: any }) => opt.value === trimmedAnswer);
        return option ? option.label : trimmedAnswer;
      });
    };
  
    const processInstanceQuestions = (instance: any) => {
      const processedInstance = { ...instance };
      for (const key in processedInstance) {
        if (key !== 'instanceIdentifier') {
          processedInstance[key].answers = mapAnswersToLabels(
            processedInstance[key].answers,
            processedInstance[key].optionsAvailableForUser
          );
          delete processedInstance[key].optionsAvailableForUser;
        }
      }
      return processedInstance;
    };
  
    return data.map((question) => {
      if (question.responseType === 'matrix' && question.instanceQuestions) {
        const processedInstanceQuestions = question.instanceQuestions.map(processInstanceQuestions);
        return { ...question, instanceQuestions: processedInstanceQuestions };
      } else {
        const processedQuestion = { ...question };
        processedQuestion.answers = mapAnswersToLabels(question.answers, question.optionsAvailableForUser);
        delete processedQuestion.optionsAvailableForUser;
        return processedQuestion;
      }
    });
  }
  
  openDialog(evidence: any) {
    const dialogRef = this.dialog.open(SurveyPreviewComponent, {
      width: '400px',
      data: {
        objectType:evidence?.type,
        objectUrl:evidence?.url
      }  
    });
  
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.filteredQuestions=result;
        this.applyFilter()
      }
    });
  }

  closeDialog() {
    this.isModalOpen = false;
  }

  openFilterDialog() {
    const dialogRef = this.dialog.open(SurveyFilterComponent, {
      width: '400px',
      data: { allQuestions: this.allQuestions }  
    });
  
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.filteredQuestions=result;
        this.applyFilter()
      }
    });
  }

  closeFilter() {
    this.isFilterModalOpen = false;
  }

  updateFilteredQuestions() {
    this.filteredQuestions = this.allQuestions.filter(question => question.selected);
  }
  checkAnswerValue(answer: any): string | number {
    if (typeof answer === 'string') {
      return answer.trim() === '' ? 'NA' : answer;
    }
    return answer;
  }

  applyFilter() {
    this.updateFilteredQuestions();
    const questionsToProcess = this.filteredQuestions.length > 0 ? this.filteredQuestions : this.allQuestions;
    this.reportDetails = this.processSurveyData(questionsToProcess);
  }
 
openUrl(evidence: any) {
  window.open(evidence, '_blank');
}

allEvidenceClick(question){
  const queryParams = {
    submissionId: this.submissionId,
    questionExternalId: question?.order,
    surveyEvidence:true,
    solutionId:this.solutionId
  };
  this.route.navigate(['viewAllEvidences'],{
    queryParams:queryParams
  })
}

}
