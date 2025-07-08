
export const listingConfig:any ={
    observation:{
      title:'Observation',
      solutionType:'observation',
      description:'OBSERVATION_LISTING_MESSAGE',
    },
    survey :{
      title:'Survey',
      solutionType:'survey',
      description:'SURVEY_DESC',
    },
    observationReports:{
      title:'Observation Reports',
      solutionType:'observation',
      description:'OBSERVATION_REPORTS_DESC',
    },
    surveyReports:{
      title:'Survey Reports',
      solutionType:'survey',
      description:'SURVEY_DESC',
    }
}
export const dialogConfirmationMap ={
  observeAgain:{
    title:'OBSERVE_AGIAN',
    close:true,
    message:'OBSERVE_AGIAN_MSG',
  },
  downloadPop:{
    message:'DOWNLOAD_MSG'
  }
}

export const surveyStatusMap = {
  expired:{
    path:'assets/images/survey-expired.svg',
    text:'SURVEY_EXPIRED_MSG'
  },
  completed:{
    path:'assets/images/submitted.svg',
    text:'SURVEY_COMPLETED_MSG'
  }
}