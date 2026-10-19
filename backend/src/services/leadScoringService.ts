export interface LeadScoringInput {
  service?: string;
  budget?: string;
  preferredDate?: Date | string;
  phone?: string;
  email?: string;
  message?: string;
  fabricStatus?: string;
  inspirationImages?: string[];
}

export interface LeadScoreResult {
  score: number;
  quality: 'hot' | 'warm' | 'cold';
  scoreBreakdown: {
    budgetScore: number;
    timelineScore: number;
    serviceScore: number;
    detailsScore: number;
    contactScore: number;
  };
}

export function calculateLeadScore(input: LeadScoringInput): LeadScoreResult {
  let budgetScore = 10;
  const budgetStr = (input.budget || '').toLowerCase();
  if (budgetStr.includes('50,000') || budgetStr.includes('lakh') || budgetStr.includes('1,00,000') || budgetStr.includes('couture') || budgetStr.includes('above')) {
    budgetScore = 30;
  } else if (budgetStr.includes('20,000') || budgetStr.includes('30,000') || budgetStr.includes('40,000')) {
    budgetScore = 20;
  } else if (budgetStr) {
    budgetScore = 15;
  }

  let timelineScore = 10;
  if (input.preferredDate) {
    const eventTime = new Date(input.preferredDate).getTime();
    const now = Date.now();
    const diffDays = Math.round((eventTime - now) / (1000 * 60 * 60 * 24));
    if (diffDays >= 0 && diffDays <= 30) {
      timelineScore = 25;
    } else if (diffDays > 30 && diffDays <= 90) {
      timelineScore = 20;
    } else if (diffDays > 90) {
      timelineScore = 15;
    }
  }

  let serviceScore = 10;
  const serviceStr = (input.service || '').toLowerCase();
  if (serviceStr.includes('bridal') || serviceStr.includes('wedding') || serviceStr.includes('trousseau')) {
    serviceScore = 20;
  } else if (serviceStr.includes('maggam') || serviceStr.includes('embroidery') || serviceStr.includes('bespoke') || serviceStr.includes('lehenga') || serviceStr.includes('gown')) {
    serviceScore = 15;
  }

  let contactScore = 5;
  const hasPhone = Boolean(input.phone && input.phone.trim().length >= 10);
  const hasEmail = Boolean(input.email && input.email.includes('@'));
  if (hasPhone && hasEmail) {
    contactScore = 15;
  } else if (hasPhone || hasEmail) {
    contactScore = 10;
  }

  let detailsScore = 0;
  if (input.inspirationImages && input.inspirationImages.length > 0) {
    detailsScore += 5;
  }
  if (input.fabricStatus && input.fabricStatus.trim()) {
    detailsScore += 2;
  }
  if (input.message && input.message.trim().length >= 20) {
    detailsScore += 3;
  }
  detailsScore = Math.min(10, detailsScore);

  const totalScore = Math.min(100, budgetScore + timelineScore + serviceScore + contactScore + detailsScore);

  let quality: 'hot' | 'warm' | 'cold' = 'warm';
  if (totalScore >= 70) {
    quality = 'hot';
  } else if (totalScore < 45) {
    quality = 'cold';
  }

  return {
    score: totalScore,
    quality,
    scoreBreakdown: {
      budgetScore,
      timelineScore,
      serviceScore,
      detailsScore,
      contactScore,
    },
  };
}
