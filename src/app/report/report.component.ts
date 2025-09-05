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
import { ReportsService } from '../services/reports.service';
import { ObservationFilterComponent } from '../shared/observation-filter/observation-filter.component';
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
  isData:any;

  constructor(
    public router: Router,
    public apiService: ApiService,
    public toaster: ToastService,
    private cdr: ChangeDetectorRef,
    private urlParamsService: UrlParamsService,
    private route:ActivatedRoute,
    private queryParamsService: QueryParamsService,
    private dialog: MatDialog,
    private utils:UtilsService,
    private reports:ReportsService,
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
    this.isData = false;

    let payload = this.createPayload(submissionId, criteria, pdf);

    this.apiService.post(urlConfig.survey.reportUrl, payload)
      .pipe(
        finalize(() =>{
          this.isData=true
          this.loaded = true}),
        catchError((err) => {
          this.toaster.showToast(err?.error?.message, 'danger', 5000)
          throw new Error('Could not fetch the details');
        })
      )
      .subscribe((res: any) => {
        this.resultData = res?.result?.result;
        this.observationDetails = res?.result;
        this.filterData = submissionId ? this.filterData : this.observationDetails?.filters[0]?.filter?.data;
        this.totalSubmissions = res?.result?.totalSubmissions;
        this.observationId = res?.result?.observationId;
        let reportSections:any = this.scores ? [res?.result?.reportSections[0]] : res?.result?.reportSections;
        this.domainView = this.scores ? res?.result?.reportSections[1]?.chart: "";
        this.allQuestions = reportSections?.map((question:any) => {
          return { ...question, selected: true };
        });
        this.reportDetails = this.processSurveyData(this.allQuestions).map(item => {
          if (item?.evidences?.length) {
            return {
              ...item,
              evidences: this.utils.mapEvidences(item.evidences)
            };
          }
          return item;
        });
        this.cdr?.detectChanges();
        this.objectType == 'questions' ? this.renderCharts(this.reportDetails, false) : this.renderCharts(this.reportDetails, true);
        if(this.initialLoad){
          this.initialLoad = false;
          let filter = this.filterData = this.observationDetails?.filters[0]?.filter?.data;
          if(filter?.length > 1){
            this.isMultiple = 'true';
          }
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
      if (!(canvas instanceof HTMLCanvasElement)) return;
  
      const question = flattenedReportDetails[index];
      if (!question?.chart?.data) return;
  
     
      const isHorizontal = question.chart.type === 'horizontalBar';
      const chartType = isHorizontal ? 'bar' : question.chart.type;
  
      
      const chartOptions = this.getChartOptions(chartType, isHorizontal);
  
     
      Object.assign(chartOptions, this.normalizeBackendOptions(question.chart.options, isHorizontal));
  
     
      const datasets = question.chart.data.datasets.map((ds: any) => ({
        ...ds
      }));
  
      new Chart(canvas, {
        type: chartType,
        data: {
          labels: question.chart.data.labels,
          datasets
        },
        options: chartOptions
      });
    });
  }
  

  private normalizeBackendOptions(backendOptions: any, isHorizontal: boolean) {
    const options: any = { ...backendOptions };
  
    if (backendOptions?.scales) {
      if (backendOptions.scales.xAxes) {
        options.scales.x = backendOptions.scales.xAxes[0];
        delete options.scales.xAxes;
      }
      if (backendOptions.scales.yAxes) {
        options.scales.y = backendOptions.scales.yAxes[0];
        delete options.scales.yAxes;
      }
    }
  
    if (isHorizontal) {
      options.indexAxis = 'y';
    }
  
    return options;
  }
  
  

  private getChartOptions(chartType: string, isHorizontalBar: boolean): any {
    const options: any = {
      indexAxis: 'y',
      maintainAspectRatio: true,
      responsive: true,
      scales: {
        x: { stacked: true },
        y: {
          stacked: true,
          ticks: { autoSkip: false },
          categoryPercentage: 0.6,
          barPercentage: 0.8
        }
      },
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

openDialog(evidence: any) {
    this.dialog.open(SurveyPreviewComponent, {
      width: '400px',
      data: {
        objectType:evidence?.type,
        objectUrl:evidence.previewUrl
      }
    })
  }

  closeDialog() {
    this.isModalOpen = false;
  }

  openFilter() {
     const dialogRef = this.dialog.open(ObservationFilterComponent, {
          width: '400px',
          data: { 
            allQuestions: this.allQuestions,
            observationType:this.observationType
           }  
        });
      
        dialogRef.afterClosed().subscribe((result) => {
          if (result) {
            this.filteredQuestions=result
           this.applyFilter()
          }
        });
  }

 


  checkAnswerValue(answer: any): string | number {
    if (typeof answer === 'string') {
      return answer.trim() === '' ? 'NA' : answer;
    }
    return answer;
  }

  applyFilter(reset: boolean = false) {

    const questionsToProcess = this.filteredQuestions.length > 0 ? this.filteredQuestions : this.allQuestions;
    this.reportDetails = this.processSurveyData(questionsToProcess);
    this.cdr.detectChanges();
    this.objectType == 'questions' ? this.renderCharts(this.reportDetails, false) : this.renderCharts(this.reportDetails, true);
    if (!reset && this.filteredQuestions.length === 0) {
      this.toaster.showToast('SELECT_ATLEAST_ONE_QUESTION', 'danger');
    }

  }

  resetFilter() {
    this.allQuestions.forEach(question => question.selected = false);
    this.filteredQuestions = [];
    this.applyFilter(true);
  }

  openUrl(evidence: any) {
    window.open(evidence, '_blank');
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
          await this.openUrl(res?.result?.pdfUrl);
          return;
        }
        await this.reports.shareReport(res?.result?.pdfUrl,'observation')
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
    this.router.navigate(['/observation-led-imp'], { state: { improvementProjectSuggestions: this.observationDetails?.improvementProjectSuggestions, programName : this.observationDetails?.solutionName } });
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
