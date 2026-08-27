import { IsIn, IsOptional } from 'class-validator';

export const INTERVIEW_TYPES = ['behavioral', 'technical', 'mixed'] as const;
export type InterviewType = (typeof INTERVIEW_TYPES)[number];

export class StartSessionDto {
  // Optional + defaulted server-side rather than required, so any old
  // frontend build (or a direct API call) still works without a body.
  @IsOptional()
  @IsIn(INTERVIEW_TYPES)
  type?: InterviewType;
}
