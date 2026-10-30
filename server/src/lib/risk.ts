export type AcademicProfile = {
  studentId?: string | null;
  course?: string | null;
  department?: string | null;
  yearOfStudy?: number | null;
  semester?: string | null;
  previousSemesterGpa?: number | null;
  currentSemesterAverage?: number | null;
  catPerformance?: number | null;
  attendanceRate?: number | null;
  assignmentCompletion?: number | null;
  studyHours?: number | null;
  previousExamsFailures?: number | null;
  financialRisk?: number | null;
};

export type RiskAssessment = {
  score: number;
  level: 'Low' | 'Medium' | 'High';
  summary: string;
  recommendations: string;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function calculateRisk(profile: AcademicProfile): RiskAssessment {
  const previousSemesterGpa = Number(profile.previousSemesterGpa ?? 0);
  const currentSemesterAverage = Number(profile.currentSemesterAverage ?? 0);
  const catPerformance = Number(profile.catPerformance ?? 0);
  const attendanceRate = Number(profile.attendanceRate ?? 0);
  const assignmentCompletion = Number(profile.assignmentCompletion ?? 0);
  const studyHours = Number(profile.studyHours ?? 0);
  const previousExamsFailures = Number(profile.previousExamsFailures ?? 0);
  const financialRisk = Number(profile.financialRisk ?? 0);

  let score = 0;

  if (attendanceRate < 70) score += 20;
  if (assignmentCompletion < 75) score += 18;
  if (currentSemesterAverage < 60) score += 24;
  if (catPerformance < 50) score += 12;
  if (previousSemesterGpa > 0 && previousSemesterGpa < 2.5) score += 11;
  if (previousExamsFailures > 0) score += 8;
  if (financialRisk >= 5) score += 10;
  if (studyHours < 6) score += 10;

  score = clamp(score, 0, 100);

  let level: RiskAssessment['level'] = 'Low';
  if (score >= 70) level = 'High';
  else if (score >= 40) level = 'Medium';

  const recommendations: string[] = [];
  if (attendanceRate < 75) recommendations.push('Increase class attendance and meet lecturer office hours.');
  if (assignmentCompletion < 80) recommendations.push('Prioritize assignment submission deadlines and review earlier submission gaps.');
  if (currentSemesterAverage < 60) recommendations.push('Book a targeted academic-support session for weak units.');
  if (studyHours < 6) recommendations.push('Create a fixed study timetable and allocate at least six hours weekly.');
  if (financialRisk >= 5) recommendations.push('Connect the student to bursary or financial aid support.');
  if (recommendations.length === 0) recommendations.push('Maintain current progress and continue active academic planning.');

  const summary =
    level === 'High'
      ? 'The student shows several academic risk signals that require urgent intervention and close support.'
      : level === 'Medium'
        ? 'The student has moderate risk indicators. Early intervention can prevent performance decline.'
        : 'The student is currently on track, with low academic risk indicators.';

  return {
    score,
    level,
    summary,
    recommendations: recommendations.join(' '),
  };
}
