import * as urlConfig from '../constants/url-config.json';

export const listingConfig:any ={
    observation:{
      title:'Observation',
      solutionType:'observation',
      description:'OBSERVATION_LISTING_MESSAGE',
      placeholder:'SEARCH_PLACEHOLDER',
      searchTerm:'',
      urlPath:urlConfig['observation'].listing+'observation&search=',
      isObservation:true,
      observation:true
    },
    survey :{
      title:'Survey',
      solutionType:'survey',
      description:'SURVEY_DESC',
      placeholder:'SEARCH_PLACEHOLDER',
      searchTerm:'',
      urlPath:urlConfig['observation'].listing+'survey&surveyReportPage=false&search=',
      surveyPage:true,
      isSurvey:true,
    },
    observationReports:{
      title:'Observation Reports',
      solutionType:'observation',
      description:'OBSERVATION_REPORTS_DESC',
      placeholder:'SEARCH_PLACEHOLDER',
      showSearch:true,
      urlPath:urlConfig['observation'].reportListing,
      isObservation:true,
    },
    surveyReports:{
      title:'Survey Reports',
      solutionType:'survey',
      description:'SURVEY_DESC',
      placeholder:'SEARCH_PLACEHOLDER',
      searchTerm:'',
      urlPath:urlConfig['observation'].listing+'survey&surveyReportPage=true&search=',
      isSurvey:true,
      surveyReports:true,
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

export const  statusMappings = {
  'active': { tagClass: 'tag-not-started', statusLabel: 'Not Started' },
  'draft': { tagClass: 'tag-in-progress', statusLabel: 'In Progress' },
  'started': { tagClass: 'tag-in-progress', statusLabel: 'In Progress' },
  'completed': { tagClass: 'tag-completed', statusLabel: 'Completed' },
  'expired': { tagClass: 'tag-expired', statusLabel: 'Expired' }
};