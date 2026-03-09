export interface LandingCareer {
  id: string;
  title: string;
  description: string;
  category: 'T.S.U' | 'Licenciatura' | 'Ingeniería';
  image: string;
  color: 'primary' | 'success' | 'info' | 'warning' | 'error';
  order: number;
  active: boolean;
}

export interface LandingFAQ {
  id: string;
  question: string;
  answer: string;
  order: number;
  active: boolean;
}

export interface LandingHeroConfig {
  title: string;
  subtitle: string;
  highlightTexts: string[];
  primaryButtonText: string;
  primaryButtonLink: string;
  secondaryButtonText: string;
  statsText: string;
  statsCount: number;
  mainImage: string;
  successCardTitle: string;
  successCardValue: string;
  successCardSubtitle: string;
  companiesCardTitle: string;
  companiesCardValue: string;
  companiesCardSubtitle: string;
}

export interface LandingMissionVision {
  missionTitle: string;
  missionText: string;
  visionTitle: string;
  visionText: string;
}

export interface LandingProcessStep {
  id: string;
  number: string;
  title: string;
  description: string;
  icon: string;
  order: number;
  active: boolean;
}

export interface LandingGraduateStats {
  title: string;
  subtitle: string;
  totalRangeMin: number;
  totalRangeMax: number;
  annualRangeMin: number;
  annualRangeMax: number;
  successRate: number;
  processDefinition: string;
  durationText: string;
  notes: string;
}

export interface LandingConfig {
  id: string;
  hero: LandingHeroConfig;
  missionVision: LandingMissionVision;
  careers: LandingCareer[];
  faqs: LandingFAQ[];
  processSteps: LandingProcessStep[];
  graduateStats: LandingGraduateStats;
  updatedAt: string;
  updatedBy: string;
}

export interface LandingConfigUpdate {
  hero?: Partial<LandingHeroConfig>;
  missionVision?: Partial<LandingMissionVision>;
  careers?: LandingCareer[];
  faqs?: LandingFAQ[];
  processSteps?: LandingProcessStep[];
  graduateStats?: Partial<LandingGraduateStats>;
}