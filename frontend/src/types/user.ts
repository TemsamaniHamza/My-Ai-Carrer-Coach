export interface ExperienceItem {
  company: string;
  role: string;
  duration: string;
  description?: string;
}

export interface EducationItem {
  institution: string;
  degree: string;
  duration: string;
  description?: string;
}

export interface StrengthsWeaknesses {
  strengths: string[];
  weaknesses: string[];
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  title: string | null;
  summary: string | null;
  skills: string[];
  experience: ExperienceItem[];
  education: EducationItem[];
  languages: string[];
  strengthsWeaknesses: StrengthsWeaknesses | null;
  createdAt: string;
  updatedAt: string;
}

/** Matches backend UpdateProfileDto — email/password are never editable here. */
export interface UpdateProfileInput {
  name?: string;
  title?: string;
  summary?: string;
  skills?: string[];
  languages?: string[];
  experience?: ExperienceItem[];
  education?: EducationItem[];
}

/** Matches backend ExtractedProfile — the result of POST /users/me/resume-import. */
export interface ExtractedProfile {
  name?: string;
  title?: string;
  summary?: string;
  skills: string[];
  languages: string[];
  experience: ExperienceItem[];
  education: EducationItem[];
}
