import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'cleanAnswers',
  standalone: false
})
export class CleanAnswersPipe implements PipeTransform {

  transform(answers: any[]): any[] {
    if (!Array.isArray(answers)) return [];

    return answers.map(innerArr => {
      if (Array.isArray(innerArr)) {
        return innerArr.filter(ans => ans !== '' && ans != null && ans !== false && ans !== true);
      }
      return innerArr;
    });
  }

}
