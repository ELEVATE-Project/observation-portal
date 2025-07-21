import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as urlConfig from '../constants/url-config.json';
import { ApiService } from '../services/api.service';
import { ToastService } from '../services/toast.service';
import { NetworkServiceService } from 'network-service';
import { Location } from '@angular/common';
import { catchError } from 'rxjs/operators';
import { UtilsService } from '../services/utils.service';

@Component({
  selector: 'app-deeplink-redirect',
  standalone: false,
  templateUrl: './deeplink-redirect.component.html',
  styleUrl: './deeplink-redirect.component.css'
})
export class DeeplinkRedirectComponent {
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
    this.route.paramMap.subscribe(async (param:any)=>{
      this.type = param.get("type")
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
        this.router.navigate([
          'details',
          stateData?.assessment?.name,
          stateData?.programId,
          stateData?.solution?._id,
          false
        ]);
        }
    }
  };


  checkLinkType(){
    let profileData = this.utils.getProfileData()
    if(!profileData) return
    if (this.type === 'observation') {
      this.handleObservationLink();
    } else if (this.type === 'survey') {
      this.handleSurveyLink();
    }
  }

  navigateToEntities(data){
    setTimeout(() => {
      this.router.navigate([
        'entityList',
        data?.solutionId,
        data?.name,
        data?.type,
        data?.programId
      ],{ replaceUrl: true }
      );
    }
    , 100);
  }
  fetchTemplateDetails(data){
    this.apiService.post(urlConfig.observation.templateDetails+ `${data.solutionId}`,this.apiService.profileData).pipe(catchError((err: any) => {
      this.toastService.showToast(err?.error?.message, 'Close');
      throw Error(err);
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
    await this.router.navigate([`/listing/${this.type}`],{replaceUrl:true});
    if (resp?.solution?.isRubricDriven) {
      this.router.navigate([
        'domain',
        resp?.solution?._id,
        resp?.assessment?.name,
        resp?.solution?._id
      ],{
        state:{data:{...resp,solutionType:this.type,isSurvey:false}},
    });
    } else {
      this.router.navigate(['questionnaire'], {
        queryParams:{
          solutionType:this.type,
        },
        state:{ data:{...resp,isSurvey:false}}
      });
    }
  }

  async handleObservationLink(){
    // if(!this.apiService.profileData){
    //   await this.router.navigate([`/listing/${this.type}`]);
    //   return
    // }
    this.apiService.post(urlConfig.observation.observationVerifyLink+this.linkId+"?createProject=false",this.apiService.profileData).pipe(
      catchError((err: any) => {
        this.toastService.showToast(err?.error?.message, 'Close');
        throw Error(err);
      })
    ).subscribe((res:any)=>{
      if(res && res?.result){
        res?.result.observationId ? this.navigateToEntities(res?.result) : this.fetchTemplateDetails(res?.result);  
      }else{
        this.location.back()
      }
    },(err:any)=>{
      this.toastService.showToast('MSG_INVALID_LINK',"danger")
      this.router.navigate([`/listing/${this.type}`]);
    })
  }

  async handleSurveyLink() {
    // if(!this.apiService.profileData){
    //   await this.router.navigate([`/listing/${this.type}`]);
    //   return
    // }
     this.apiService.post(
        urlConfig.survey.surveyVerifyLink+this.linkId,
          this.apiService?.profileData
        ).pipe(
          catchError((err: any) => {
            this.toastService.showToast(err?.error?.message, 'Close');
            throw Error(err);
          })
        )
          .subscribe(async (res: any) => {
            if (res.result === false) {
              await this.router.navigate(['surveyStatus'],{
                queryParams:{
                  status:'expired'
                }
              })
              return;
            }
            if (res.result.status && res.result.status === 'completed') {
              await this.router.navigate(['surveyStatus'],{
                queryParams:{
                  status:res?.result?.status
                }
              })
              return;
            }
            this.navigateToSurvey(res?.result);
          },(err:any)=>{
            this.toastService.showToast('MSG_INVALID_LINK',"danger")
            this.router.navigate([`/listing/${this.type}`]);
          })
  }

  async navigateToSurvey(data:any){
    // await this.router.navigate([`/listing/${this.type}`,{replaceUrl:true}]);
    this.router.navigate(['questionnaire'], {
      queryParams:{
        index: 0, 
        submissionId:data?.assessment?.submissionId,
        solutionId:data?.solution?._id,
        solutionType:this.type
      },
      state:{data:{...data,isSurvey:true},
    },
    replaceUrl:true
    });
  }

}