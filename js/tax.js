// India Income Tax — FY 2024-25 and FY 2025-26

// New regime slabs — FY 2024-25 (Budget 2024)
const NEW_SLABS_2425 = [
  { min: 0,        max: 300000,  rate: 0   },
  { min: 300000,   max: 700000,  rate: 5   },
  { min: 700000,   max: 1000000, rate: 10  },
  { min: 1000000,  max: 1200000, rate: 15  },
  { min: 1200000,  max: 1500000, rate: 20  },
  { min: 1500000,  max: Infinity,rate: 30  }
];

// New regime slabs — FY 2025-26 (Budget 2025)
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

function calcSurcharge(tax, income) {
  if (income > 50000000) return tax * 0.37;
  if (income > 20000000) return tax * 0.25;
  if (income > 10000000) return tax * 0.15;
  if (income > 5000000)  return tax * 0.10;
  return 0;
}

function calcNew(grossSalary, employerNPS, year) {
  employerNPS = employerNPS || 0;
  year = year || '2425';

  const stdDed = 75000;
  const taxableIncome = Math.max(0, grossSalary - stdDed - employerNPS);

  const slabs = year === '2526' ? NEW_SLABS_2526 : NEW_SLABS_2425;
  let { tax, breakdown } = calcTaxOnSlabs(taxableIncome, slabs);

  let rebate = 0;
  let marginalRelief = 0;

  if (year === '2526') {
    // FY 2025-26: 87A rebate ₹60,000 for taxable income ≤ ₹12,00,000
    if (taxableIncome <= 1200000) {
      rebate = Math.min(tax, 60000);
      tax = Math.max(0, tax - rebate);
    } else {
      // Marginal relief: tax must not exceed (taxableIncome − 12L)
      const excess = taxableIncome - 1200000;
      if (tax > excess) {
        marginalRelief = tax - excess;
        tax = excess;
      }
    }
  } else {
    // FY 2024-25: 87A rebate ₹25,000 for taxable income ≤ ₹7,00,000
    if (taxableIncome <= 700000) {
      rebate = Math.min(tax, 25000);
      tax = Math.max(0, tax - rebate);
    }
  }

  const surcharge = calcSurcharge(tax, taxableIncome);
  const cess = (tax + surcharge) * 0.04;
  const totalTax = tax + surcharge + cess;
  return { taxableIncome, stdDed, employerNPS, tax, rebate, marginalRelief, surcharge, cess, totalTax, breakdown };
}

function calcOld(grossSalary, deductions, year) {
  year = year || '2425';
  const stdDed = 50000;
  const total80C  = Math.min(deductions.d80C || 0, 150000);
  const total80D  = Math.min(deductions.d80D || 0, 75000);
  const hraEx     = deductions.hra || 0;
  const otherDed  = deductions.other || 0;
  const employerNPS = deductions.employerNPS || 0;

  const totalDed = stdDed + total80C + total80D + hraEx + otherDed + employerNPS;
  const taxableIncome = Math.max(0, grossSalary - totalDed);
  let { tax, breakdown } = calcTaxOnSlabs(taxableIncome, OLD_SLABS);

  // Section 87A rebate: taxable income ≤ ₹5L → rebate up to ₹12,500 (old regime, both years)
  const rebate = taxableIncome <= 500000 ? Math.min(tax, 12500) : 0;
  tax = Math.max(0, tax - rebate);

  const surcharge = calcSurcharge(tax, taxableIncome);
  const cess = (tax + surcharge) * 0.04;
  const totalTax = tax + surcharge + cess;
  return { taxableIncome, stdDed, total80C, total80D, hraEx, otherDed, employerNPS, totalDed, tax, rebate, surcharge, cess, totalTax, breakdown };
}

function fmt(n) {
  return '₹' + Math.round(n).toLocaleString('en-IN');
}

function fmtL(n) {
  if (n >= 10000000) return (n / 10000000).toFixed(2) + ' Cr';
  if (n >= 100000)   return (n / 100000).toFixed(2) + ' L';
  return Math.round(n).toLocaleString('en-IN');
}
