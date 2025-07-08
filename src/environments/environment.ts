interface Environment {
    production: boolean;
    surveyBaseURL?: string;
    hostPath?: string;
}
export const environment:Environment = {
    production: true,
    surveyBaseURL: window['env' as any]['surveyBaseURL' as any] as unknown as string,
    hostPath: window['env' as any]['hostPath' as any] as unknown as string
}

// src/assets/envirnoments/environment.ts