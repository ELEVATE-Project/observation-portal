import { Component , OnInit} from '@angular/core';
import { surveyStatusMap } from '../constants/actionContants';
import { QueryParamsService } from '../services/queryParams.service';

@Component({
  selector: 'app-survey-expired',
  standalone: false,
  templateUrl: './survey-expired.component.html',
  styleUrl: './survey-expired.component.css'
})
export class SurveyExpiredComponent implements  OnInit{
  surveyMessage:any

  constructor(private queryParamService:QueryParamsService){}

  ngOnInit(): void {
    this.queryParamService.parseQueryParams()
    this.surveyMessage=surveyStatusMap[this.queryParamService.surveyStatus]
  }

}
