import { booleanAttribute, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import * as urlConfig from '../constants/url-config.json';
import { ToastService } from '../services/toast.service';
import { catchError, finalize } from 'rxjs';
import { ApiConfiguration } from '../interfaces/questionnaire.type';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Chart,
  PieController,
  BarController,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from 'chart.js';
import { UrlParamsService } from '../services/urlParams.service';
import { QueryParamsService } from '../services/queryParams.service';
import { SurveyPreviewComponent } from '../shared/survey-preview/survey-preview.component';
import { MatDialog } from '@angular/material/dialog';
import { UtilsService } from '../services/utils.service';
Chart.register(PieController, BarController, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

@Component({
  selector: 'app-report',
  standalone: false,
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.css','../listing/listing.component.css']
})
export class ReportComponent implements OnInit {

  reportDetails: any[] = [];
  objectURL: any;
  objectType!: string;
  isModalOpen: boolean = false;
  isFilterModalOpen: boolean = false;
  filteredQuestions: any[] = [];
  allQuestions: any[] = [];
  observationDetails: any;
  objectKeys = Object.keys;
  submissionId: any;
  entityType: any;
  @Input() apiConfig: ApiConfiguration;
  @Input({ transform: booleanAttribute }) angular = false;
  resultData:any;
  totalSubmissions: any;
  observationId: any;
  observationType: any = 'questions';
  entityId:any;
  loaded = false;
  filterData:any;
  isMultiple:any;
  scores:any;
  domainView:any;
  initialLoad:boolean = true;

  constructor(
    public router: Router,
    public apiService: ApiService,
    public toaster: ToastService,
    private cdr: ChangeDetectorRef,
    private urlParamsService: UrlParamsService,
    private route:ActivatedRoute,
    private queryParamsService: QueryParamsService,
    private dialog: MatDialog,
    private utils:UtilsService
  ) {}

  ngOnInit() {
    this.queryParamsService.parseQueryParams()
    this.urlParamsService.parseRouteParams(this.route)
    this.observationId = this.urlParamsService?.observationId;
    this.submissionId = this.queryParamsService?.submissionId;
    this.entityType = this.urlParamsService?.entityType;
    this.entityId = this.urlParamsService?.entityId;
    this.isMultiple = this.urlParamsService?.isMultiple;
    const scoresValue = this.urlParamsService?.scores;
    this.scores = scoresValue === 'true';

    this.loadObservationReport(this.submissionId, false, false);
  }

  loadObservationReport(submissionId: string, criteria: boolean, pdf: boolean) {
    this.resultData = [];
    this.observationDetails = '';
    this.totalSubmissions = [];
    this.allQuestions = [];
    this.reportDetails = [];
    this.loaded = true;

    let payload = this.createPayload(submissionId, criteria, pdf);

    this.apiService.post(urlConfig.survey.reportUrl, payload)
      .pipe(
        finalize(() =>this.loaded = true),
        catchError((err) => {
          this.toaster.showToast(err?.error?.message, 'danger', 5000)
          throw new Error('Could not fetch the details');
        })
      )
      .subscribe((res: any) => {
        this.resultData = res?.result;
        this.observationDetails = res;
        let dropDownFilterData:any;
        if(this.observationDetails?.filters){
          dropDownFilterData = this.observationDetails?.filters.find(
          (item) => item?.filter?.type === 'dropdown'
        );
        }
        this.filterData = submissionId ? this.filterData : dropDownFilterData;
        this.totalSubmissions = res?.result?.totalSubmissions;
        let reportSections:any = this.scores ? [res?.reportSections[0]] : res?.reportSections;
        this.domainView = this.scores ? res?.reportSections[1]?.chart: "";
        this.allQuestions = reportSections?.map((question:any) => {
          return { ...question, selected: true };
        });
        this.reportDetails = this.processSurveyData(this.allQuestions);
        this.cdr?.detectChanges();
        this.objectType == 'questions' ? this.renderCharts(this.reportDetails, false) : this.renderCharts(this.reportDetails, true);
        if(this.initialLoad){
          this.initialLoad = false;
          this.filterData = dropDownFilterData
        }
      });
  }

  createPayload(submissionId: string, criteria: boolean, pdf: boolean): any {
    let filter;
     if(pdf){
      filter = {
        questionId: this.filteredQuestions.map(item => item?.order)
      };
     }
    return {
      submissionId,
      observation: true,
      entityType: this.entityType,
      pdf,
      filter,
      criteriaWise: criteria,
      entityId:this.entityId,
      observationId:this.observationId,
      scores:this.scores
    };
  }

  processSurveyData(data: any): any[] {
    const mapAnswersToLabels = (answers: any[], options: any[]) => {
      if (!Array.isArray(answers)) {
        return [];
      }
      return answers.map((answer: any) => {
        if (typeof answer === 'string') {
          const trimmedAnswer = answer.trim();
          if (trimmedAnswer === '') {
            return 'No response is available';
          }

          const option = options?.find((opt: { value: any }) => opt?.value === trimmedAnswer);
          return option ? option?.label : trimmedAnswer;
        }
        return answer;
      });
    };

    const processQuestion = (question: any) => {
      if (question?.responseType === 'matrix' && question?.answers) {
        const processedInstanceQuestions = question?.answers.map(processInstanceQuestions);
        return { ...question, answers: processedInstanceQuestions };
      } else {
        const processedQuestion = { ...question };
        processedQuestion.answers = this.scores ? "" :mapAnswersToLabels(question?.answers, question?.options);
        delete processedQuestion?.options;
        processedQuestion.chartData = this.isChartNotEmpty(processedQuestion?.chart)
        return processedQuestion;
      }
    };

    const processInstanceQuestions = (instance: any) => {
      const processedInstance = { ...instance };
      for (const key in processedInstance) {
        if (key !== 'instanceIdentifier') {
          processedInstance[key].answers = mapAnswersToLabels(
            processedInstance[key].answers,
            processedInstance[key].options
          );
          delete processedInstance[key].options;
        }
      }
      return processedInstance;
    };

    if (this.observationType === 'questions') {
      return data.map(processQuestion);
    } else {
      return data.map((criterias) => {
          return criterias?.questionArray.map(processQuestion);
      });
    }
  }


  renderCharts(reportDetails: any[], isCriteria: boolean = false) {
    const flattenedReportDetails = isCriteria ? reportDetails.flat() : reportDetails;
    const canvases = document.querySelectorAll('.chart-canvas');

    canvases.forEach((canvas, index) => {
      if (canvas instanceof HTMLCanvasElement) {
        const question = flattenedReportDetails[index];
        if (question?.chart) {
          const chartType = question?.chart?.type === 'horizontalBar' ? 'bar' : question?.chart?.type;
          const chartOptions = this.getChartOptions(chartType, question?.chart?.type === 'horizontalBar');
          chartOptions.datasets = [{
            barThickness: 15,
            maxBarThickness: 20,
          }];

          new Chart(canvas, {
            type: chartType,
            data: question?.chart?.data,
            options: chartOptions
          });
        }
      } else {
        console.warn(`Element at index ${index} is not a canvas!`);
      }
    });
  }

  private getChartOptions(chartType: string, isHorizontalBar: boolean): any {
    const options: any = {
      maintainAspectRatio: true,
      plugins: {
        datalabels: {
          display: true,
        },
        legend: {
          display: true,
        },
        tooltip: {
          enabled: true
        },
      }
    };

    if (chartType === 'bar') {
      options.scales = {
        x: {
          beginAtZero: true,
          ticks: {
            autoSkip: false,
            maxRotation: 0,
            minRotation: 0
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            autoSkip: false
          }
        }
      };

      if (isHorizontalBar) {
        options.indexAxis = 'y';
      }
    }

    return options;
  }

async openDialog(url: any, type: string) {
    this.dialog.open(SurveyPreviewComponent, {
      width: '400px',
      data: {
        objectType:type,
        objectUrl:url
      }
    })
  }

  closeDialog() {
    this.isModalOpen = false;
  }

  openFilter() {
    this.isFilterModalOpen = true;
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

  applyFilter(reset: boolean = false) {
    this.updateFilteredQuestions();

    const questionsToProcess = this.filteredQuestions.length > 0 ? this.filteredQuestions : this.allQuestions;
    this.reportDetails = this.processSurveyData(questionsToProcess);
    this.cdr.detectChanges();
    this.objectType == 'questions' ? this.renderCharts(this.reportDetails, false) : this.renderCharts(this.reportDetails, true);
    if (!reset && this.filteredQuestions.length === 0) {
      this.toaster.showToast('SELECT_ATLEAST_ONE_QUESTION', 'danger');
    }

    if (reset || this.filteredQuestions.length > 0) {
      this.closeFilter();
    }
  }

  resetFilter() {
    this.allQuestions.forEach(question => question.selected = false);
    this.filteredQuestions = [];
    this.applyFilter(true);
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

  isChartNotEmpty(chart: any, i?:any) {
    return Object.keys(chart).length > 0 ? true : false;
  }

  toggleObservationType(type: any) {
    this.observationType = type;
    type == 'questions' ? this.loadObservationReport(this.submissionId, false, false) : this.loadObservationReport(this.submissionId, true, false);
  }

  downloadPDF(submissionId: string, criteria: boolean, pdf: boolean,type:any) {
    this.loaded = false;
    let payload = this.createPayload(submissionId, criteria, pdf);
    this.apiService.post(urlConfig.survey.reportUrl, payload)
      .pipe(
        finalize(() =>this.loaded = true),
        catchError((err) => {
          throw new Error('Could not fetch the details');
        })
      )
      .subscribe(async (res: any) => {
        if(type === 'download'){
        const shareOptions = {
          type: "preview",
          title: "data.pdf",
          fileType: "pdf",
          isBase64: false,
          url: res?.pdfUrl
        }

        let response = await this.utils.postMessageListener(shareOptions)
        if(!response){
          this.openUrl(res?.pdfUrl)
        }
      }else{
        const shareOptions = {
            title: this.generateName(),
            text: 'Check out this observation report',
            url: res.pdfUrl,
            type:"share"
          };
        let response = await this.utils.postMessageListener(shareOptions)
        if(!response){
          this.toaster.showToast("SHARE_FAILED", 'danger');
        }
      }
      });
  }
  generateName(){
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const formattedDateTime = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}-${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
    return `report_${formattedDateTime}`;
  }
  onSelectionChange(submissionId: string): void {
    this.submissionId = submissionId;
    this.observationType == 'questions' ? this.loadObservationReport(submissionId, false, false) : this.loadObservationReport(submissionId, true, false);
  }

  navigateToObservationLedImpPage(){
    this.router.navigate(['/observation-led-imp'], { state: { improvementProjectSuggestions: this.observationDetails?.improvementProjectSuggestions, programName : this.observationDetails?.programName } });
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
  allEvidenceClick(question:any){
    const queryParams = {
      submissionId: this.submissionId,
      observationId: this.observationId,
      entityId: this.entityId,
      questionExternalId: question?.order,
      entityType: this.entityType,
    };
    this.router.navigate(['viewAllEvidences'],{
      queryParams:queryParams
    })
  }

}
