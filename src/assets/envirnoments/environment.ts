interface Environment {
    production: boolean;
    surveyBaseURL?: string;
    capabilities:'all' | 'survey';
    navigateBaseHref?: string;
}
export const environment:Environment = {
    production: true,
    surveyBaseURL: window['env' as any]['surveyBaseURL' as any] as unknown as string,
    capabilities:window['env' as any]['capabilities' as any] as unknown as any,
    navigateBaseHref: window['env' as any]['navigateBaseHref' as any] as unknown as string
}