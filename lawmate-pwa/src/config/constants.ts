export interface ConsultationPlan {
  id: 'QUICK' | 'STANDARD' | 'DETAILED';
  name: string;
  duration: string;
  durationMinutes: number;
  price: number;
  description: string;
}

export const CONSULTATION_PLANS: Record<string, ConsultationPlan> = {
  QUICK: {
    id: 'QUICK',
    name: 'Quick Consultation',
    duration: '15 min',
    durationMinutes: 15,
    price: 200,
    description: '15-minute quick legal advice for immediate queries'
  },
  STANDARD: {
    id: 'STANDARD',
    name: 'Standard Consultation',
    duration: '30 min',
    durationMinutes: 30,
    price: 400,
    description: '30-minute in-depth consultation & document guidance'
  },
  DETAILED: {
    id: 'DETAILED',
    name: 'Detailed Consultation',
    duration: '60 min',
    durationMinutes: 60,
    price: 800,
    description: '60-minute comprehensive case review & legal strategy'
  }
};

export const DEFAULT_PLAN_ID = 'STANDARD';
export const CONSULTATION_FEE = 400;
export const DEFAULT_CONSULTATION_FEE = 400;
export const CONSULTATION_FEE_PAISE = CONSULTATION_FEE * 100;
