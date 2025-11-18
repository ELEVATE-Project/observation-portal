import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as urlConfig from '../constants/url-config.json';
import { ApiService } from '../services/api.service';
import { ToastService } from '../services/toast.service';
import { NetworkServiceService } from 'network-service';
import { Location } from '@angular/common';
import { catchError } from 'rxjs/operators';
import { UtilsService } from '../services/utils.service';
import { EMPTY } from 'rxjs';
@Component({
  selector: 'app-deeplink-redirect',
  standalone: false,
  templateUrl: './deeplink-redirect.component.html',
  styleUrl: './deeplink-redirect.component.css'
})
export class DeeplinkRedirectComponent implements OnInit {
  type:any;
  linkId:any;
  isOnline:any;
  constructor(
    private route: ActivatedRoute, 
    private router: Router,
    private apiService : ApiService,
    private toastService :ToastService,
    private network:NetworkServiceService,
    private location: Location,
    private utils:UtilsService
  ) {}

  ngOnInit() {
    this.network.isOnline$.subscribe(status => this.isOnline = status);
    window.addEventListener('message', this.handleMessage);
    this.route.paramMap.subscribe((param:any)=>{
      this.type = param.get("type").replace(/^create-/, '');
      this.linkId = param.get("id")
      if(!this.isOnline){
        this.toastService.showToast('NETWORK_OFFLINE','danger')
        return
      }
      this.checkLinkType()
    })
  }

  handleMessage = async(event: MessageEvent) => {
    if (event.data?.type === 'START') {
      const stateData = event.data.data;
        if(stateData?.isATargetedSolution){
          let data:any=[
            'entityList',
            stateData?.solution?._id,
            stateData?.solution?.name
          ];
          this.redirect(data,true)
        }
    }
  };


  async checkLinkType(){
    if(!this.apiService?.profileData){
      await this.utils.getProfileDetails()
    }
    if (this.type === 'observation') {
      this.handleObservationLink();
    } else if (this.type === 'survey') {
      this.handleSurveyLink();
    }
  }

  fetchTemplateDetails(data){
    this.apiService.post(urlConfig.observation.templateDetails+ `${data.solutionId}`,this.apiService.profileData).pipe(catchError((err: any) => {
      this.toastService.showToast(err?.error?.message, 'Close');
      return EMPTY;
    })
  ).subscribe((res:any) => {
      if (res?.result) {
        const templateData = {
          ...res?.result,
          isATargetedSolution: data?.isATargetedSolution,
          programId: data?.programId,
          programName: data?.programName
        };
        this.redirectObservation(templateData);
      }else{
      this.location.back();
      this.toastService.showToast('MSG_TEMPLATE_DETAILS_NOTFOUND','danger');
      }
    },error =>{
      this.location.back();
      this.toastService.showToast('MSG_TEMPLATE_DETAILS_NOTFOUND','danger');
    });
  }

  async redirectObservation(resp) {
    resp?.solution?.isRubricDriven ? 
    this.redirectVivaStateData(
      ['domain',resp?.solution?._id,resp?.assessment?.name,resp?.solution?._id],
      '',
      {data:{...resp,solutionType:this.type,isSurvey:false}}
    ) : this.redirectVivaStateData(
      ['questionnaire'],
      {solutionType:this.type},
      { data:{...resp,isSurvey:false}}
    )
  }

  async handleObservationLink(){
    this.apiService.post(urlConfig.observation.observationVerifyLink+this.linkId+"?createProject=false",this.apiService.profileData).pipe(
      catchError((err: any) => {
        this.toastService.showToast(err?.error?.message ?? 'MSG_INVALID_LINK', 'danger');
        setTimeout(()=>{
          this.utils.navigateToHomePage();
        },2000)
        return EMPTY;
      })
    ).subscribe((res:any)=>{
      if(res && res?.result){
        res?.result.observationId ? 
        this.redirect(['entityList',res?.result?.solutionId,res?.result?.name,res?.result?.type])
        : this.fetchTemplateDetails(res?.result);  
      }
    })
  }

  async handleSurveyLink() {
     this.apiService.post(
        urlConfig.survey.surveyVerifyLink+this.linkId,
          this.apiService?.profileData
        ).pipe(
          catchError((err: any) => {
            this.toastService.showToast(err?.error?.message ?? 'MSG_INVALID_LINK', 'danger');
            setTimeout(()=>{
              this.utils.navigateToHomePage();
            },2000)
            return EMPTY;
          })
        )
          .subscribe(async (res: any) => {
            if (res.result === false) {
              await this.redirect(['surveyStatus'],{status:'expired'},true)
              return;
            }
            if (res.result.status && res.result.status === 'completed') {
              await this.redirect(['surveyStatus'],{status:res?.result?.status},true)
              return;
            }
            this.navigateToSurvey(res?.result);
          })
  } 
  navigateToSurvey(data:any){
    this.redirectVivaStateData(
        ['questionnaire'],
        { index: 0, submissionId:data.assessment?.submissionId,solutionId:data.solution?._id,solutionType:this.type},
        {data:{...data,isSurvey:true}}
    )
}

  async redirect(route, queryParams?: any,replace: boolean = false ){
    window.history.replaceState({}, '','/home');
    setTimeout(()=>{
      this.router.navigate(route,{
        queryParams:queryParams,
        replaceUrl:replace
      })
    },300)
  }

  async redirectVivaStateData(route,queryParams,stateData){
    window.history.replaceState({},'','/home');
    setTimeout(()=>{
      this.router.navigate(route,
        {
          queryParams:queryParams,
          state:stateData
        }
      )
    },300)
  }

}