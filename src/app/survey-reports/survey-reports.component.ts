import { Component, OnInit } from '@angular/core';
import * as urlConfig from '../constants/url-config.json';
import { ApiService } from '../services/api.service';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { SurveyFilterComponent } from '../shared/survey-filter/survey-filter.component';
import { SurveyPreviewComponent } from '../shared/survey-preview/survey-preview.component';
import { UtilsService } from '../services/utils.service';
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
  loaded:any=false;
  constructor(
    private apiService: ApiService,
    private dialog: MatDialog,
    private router:ActivatedRoute, 
    private utils:UtilsService,
    public route: Router,
  ) {}

  ngOnInit() {
    this.router.params.subscribe(param => {
      this.submissionId = param['id'];
      this.solutionId=param['solutionId']
      this.loaded=false;
      this.apiService.post(urlConfig.survey.reportUrl,{
        "survey": true,
        "submissionId": this.submissionId,
        "pdf": false
      }).pipe(finalize(()=>this.loaded = true))
      .subscribe((res:any) => { 
        this.surveyName = res.solutionName
        this.allQuestions = res.reportSections;
        this.reportDetails = this.processSurveyData(res.reportSections);
      })
    })
  
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
  
  

  openDialog(url: string, type: string) {
    const dialogRef = this.dialog.open(SurveyPreviewComponent, {
      width: '400px',
      data: {
        objectType:type,
        objectUrl:url
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
 
async openUrl(evidence: any) {
      const shareOptions = {
          type: "preview",
          title:`evidence.${evidence.extension}`,
          fileType: evidence.extension,
          isBase64: false,
          url: evidence.url
      }
      let response = await this.utils.postMessageListener(shareOptions)
      if(!response){
        window.open(evidence.url, '_blank');
      }
    }

    getEvidenceType(extension: string): 'image' | 'video' | 'audio' | 'url' | 'unknown' {
      const ext = extension.toLowerCase();
      const imageExts = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'hevc'];
      const videoExts = ['mp4', 'avi', 'flv', '3gp', 'm4v', 'mkv', 'mov', 'ogg', 'webm', 'wmv'];
      const audioExts = ['mp3', 'wav', 'mpeg'];
      const urlExts = ['pdf', 'csv', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt'];
    
      if (imageExts.includes(ext)) return 'image';
      if (videoExts.includes(ext)) return 'video';
      if (audioExts.includes(ext)) return 'audio';
      if (urlExts.includes(ext)) return 'url';
      return 'unknown';
    }
    
    getTooltip(type: string): string {
      switch (type) {
        case 'image': return 'View image';
        case 'video': return 'View video';
        case 'audio': return 'Play audio';
        case 'url': return 'Open file';
        default: return 'Unknown file';
      }
    }
    
    getIconName(type: string, ext: string): string {
      if (type === 'image') return 'image';
      if (type === 'video') return 'videocam';
      if (type === 'audio') return 'audiotrack';
      if (ext === 'pdf') return 'picture_as_pdf';
      if (type === 'url') return 'article';
      return 'insert_drive_file';
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
