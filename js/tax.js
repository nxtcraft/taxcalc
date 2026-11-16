// India Income Tax — FY 2024-25 to FY 2026-27 (FY 2026-27 slabs unchanged by Budget 2026)

// New regime slabs — FY 2024-25 (Budget 2024)
const NEW_SLABS_2425 = [
  { min: 0,        max: 300000,  rate: 0   },
  { min: 300000,   max: 700000,  rate: 5   },
  { min: 700000,   max: 1000000, rate: 10  },
  { min: 1000000,  max: 1200000, rate: 15  },
  { min: 1200000,  max: 1500000, rate: 20  },
  { min: 1500000,  max: Infinity,rate: 30  }
];

// New regime slabs — FY 2025-26 onward (Budget 2025; unchanged for FY 2026-27)
const NEW_SLABS_2526 = [
  { min: 0,        max: 400000,  rate: 0   },
  { min: 400000,   max: 800000,  rate: 5   },
  { min: 800000,   max: 1200000, rate: 10  },
  { min: 1200000,  max: 1600000, rate: 15  },
  { min: 1600000,  max: 2000000, rate: 20  },
  { min: 2000000,  max: 2400000, rate: 25  },
  { min: 2400000,  max: Infinity,rate: 30  }
];

// Old regime slabs (below 60 years) — same both years
const OLD_SLABS = [
  { min: 0,        max: 250000,  rate: 0   },
  { min: 250000,   max: 500000,  rate: 5   },
  { min: 500000,   max: 1000000, rate: 20  },
  { min: 1000000,  max: Infinity,rate: 30  }
];

function calcTaxOnSlabs(income, slabs) {
  let tax = 0;
  const breakdown = [];
  for (const s of slabs) {
    if (income <= s.min) break;
    const taxable = Math.min(income, s.max) - s.min;
    const slabTax = taxable * s.rate / 100;
    tax += slabTax;
    if (s.rate > 0 || taxable > 0) {
      breakdown.push({ min: s.min, max: s.max, rate: s.rate, taxable, slabTax });
    }
  }
  return { tax, breakdown };
}

const CURRENT_YEAR = '2627';
const usesBudget2025Rules = year => year >= '2526';

// New regime caps surcharge at 25% (no 37% band) since FY 2023-24.
function calcSurcharge(tax, income, regime) {
  if (income > 50000000) return tax * (regime === 'new' ? 0.25 : 0.37);
  if (income > 20000000) return tax * 0.25;
  if (income > 10000000) return tax * 0.15;
  if (income > 5000000)  return tax * 0.10;
  return 0;
}

// Tax on already-computed taxable income (after deductions). Single source of truth
// for slabs, 87A rebate, marginal relief, surcharge and cess across TaxCalc pages.
function taxOnTaxable(taxableIncome, regime, year) {
  year = year || CURRENT_YEAR;
  taxableIncome = Math.max(0, taxableIncome);
  const slabs = regime === 'old' ? OLD_SLABS : usesBudget2025Rules(year) ? NEW_SLABS_2526 : NEW_SLABS_2425;
  let { tax, breakdown } = calcTaxOnSlabs(taxableIncome, slabs);
  let rebate = 0, marginalRelief = 0;

  if (regime === 'old') {
    // Section 87A: taxable income ≤ ₹5L → rebate up to ₹12,500
    if (taxableIncome <= 500000) rebate = Math.min(tax, 12500);
    tax -= rebate;
  } else if (usesBudget2025Rules(year)) {
    // FY 2025-26 onward: 87A rebate ₹60,000 for taxable income ≤ ₹12L
    if (taxableIncome <= 1200000) {
      rebate = Math.min(tax, 60000);
      tax -= rebate;
    } else if (tax > taxableIncome - 1200000) {
      // Marginal relief: tax must not exceed the income above ₹12L
      marginalRelief = tax - (taxableIncome - 1200000);
      tax -= marginalRelief;
    }
  } else if (taxableIncome <= 700000) {
    // FY 2024-25: 87A rebate ₹25,000 for taxable income ≤ ₹7L
    rebate = Math.min(tax, 25000);
    tax -= rebate;
  }

  const reg = regime === 'old' ? 'old' : 'new';
  let surcharge = calcSurcharge(tax, taxableIncome, reg);
  // Marginal relief on surcharge: tax + surcharge may exceed the tax + surcharge at the
  // threshold just crossed (₹50L/₹1Cr/₹2Cr/₹5Cr) by no more than the income above it.
  const threshold = [50000000, 20000000, 10000000, 5000000].find(t => taxableIncome > t);
  if (threshold && surcharge > 0) {
    const taxAtT = calcTaxOnSlabs(threshold, slabs).tax;
    const cap = taxAtT + calcSurcharge(taxAtT, threshold, reg) + (taxableIncome - threshold);
    if (tax + surcharge > cap) surcharge = Math.max(0, cap - tax);
  }
  const cess = (tax + surcharge) * 0.04;
  return { tax, rebate, marginalRelief, surcharge, cess, totalTax: tax + surcharge + cess, breakdown };
}

function calcNew(grossSalary, employerNPS, year) {
  employerNPS = employerNPS || 0;
  const stdDed = 75000;
  const taxableIncome = Math.max(0, grossSalary - stdDed - employerNPS);
  return { taxableIncome, stdDed, employerNPS, ...taxOnTaxable(taxableIncome, 'new', year) };
}

function calcOld(grossSalary, deductions, year) {
  const stdDed = 50000;
  const total80C  = Math.min(deductions.d80C || 0, 150000);
  const total80D  = Math.min(deductions.d80D || 0, 75000);
  const hraEx     = deductions.hra || 0;
  const otherDed  = deductions.other || 0;
  const employerNPS = deductions.employerNPS || 0;
  const totalDed = stdDed + total80C + total80D + hraEx + otherDed + employerNPS;
  const taxableIncome = Math.max(0, grossSalary - totalDed);
  return { taxableIncome, stdDed, total80C, total80D, hraEx, otherDed, employerNPS, totalDed, ...taxOnTaxable(taxableIncome, 'old', year) };
}

function fmt(n) {
  return '₹' + Math.round(n).toLocaleString('en-IN');
}

function fmtL(n) {
  if (n >= 10000000) return (n / 10000000).toFixed(2) + ' Cr';
  if (n >= 100000)   return (n / 100000).toFixed(2) + ' L';
  return Math.round(n).toLocaleString('en-IN');
}
