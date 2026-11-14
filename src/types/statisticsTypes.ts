// Shapes of the statistics JSON under src/data/statistics. Only the fields the pages read are typed.

/** One BLGF Annual Regular Income record (ari.json). */
export interface AriRecord {
  period: string;
  summary_indicators: {
    annual_regular_income: number;
    dependency_rates: {
      lsr_dependency: number | string;
      nta_dependency: number | string;
    };
  };
  locally_sourced_revenue: {
    total_locally_sourced_revenue: number;
    tax_revenue: {
      total_tax_revenue: number;
      real_property_tax_general_fund: number;
      tax_on_business: number;
    };
    non_tax_revenue: {
      total_non_tax_revenue: number;
      regulatory_fees: number;
      receipts_from_economic_enterprises: number;
    };
  };
  other_shares_from_national_tax_collection: {
    total_other_shares: number;
  };
  other_income_sources: {
    national_tax_allotment: number;
    interest_income: number;
  };
}

/** DTI Cities and Municipalities Competitiveness Index series (cmci.json). */
export interface CmciPillar {
  name: string;
  scores: (number | null)[];
  indicators: { name: string; values: (number | null)[] }[];
}

export interface CmciData {
  meta: {
    source: string;
    years: number[];
    notes?: string;
  };
  overall_score: (number | null)[];
  pillars: CmciPillar[];
}
