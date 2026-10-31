// FY 2024-25 (AY 2025-26) India Income Tax

// New regime slabs (post Budget 2024)
const NEW_SLABS = [
  { min: 0,        max: 300000,  rate: 0   },
  { min: 300000,   max: 700000,  rate: 5   },
  { min: 700000,   max: 1000000, rate: 10  },
  { min: 1000000,  max: 1200000, rate: 15  },
  { min: 1200000,  max: 1500000, rate: 20  },
  { min: 1500000,  max: Infinity,rate: 30  }
];

// Old regime slabs (below 60 years)
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

function calcNew(grossSalary) {
  const stdDed = 75000;
  const taxableIncome = Math.max(0, grossSalary - stdDed);
  let { tax, breakdown } = calcTaxOnSlabs(taxableIncome, NEW_SLABS);

  // Section 87A rebate: if taxable income ≤ 7L, full rebate (new regime)
  const rebate = taxableIncome <= 700000 ? Math.min(tax, 25000) : 0;
  tax = Math.max(0, tax - rebate);

  const surcharge = calcSurcharge(tax, taxableIncome);
  const cess = (tax + surcharge) * 0.04;
  const totalTax = tax + surcharge + cess;
  return { taxableIncome, stdDed, tax, rebate, surcharge, cess, totalTax, breakdown };
}

function calcOld(grossSalary, deductions) {
  const stdDed = 50000;
  const total80C = Math.min(deductions.d80C || 0, 150000);
  const total80D = Math.min(deductions.d80D || 0, 75000);
  const hraEx   = deductions.hra || 0;
  const otherDed = deductions.other || 0;

  const totalDed = stdDed + total80C + total80D + hraEx + otherDed;
  const taxableIncome = Math.max(0, grossSalary - totalDed);
  let { tax, breakdown } = calcTaxOnSlabs(taxableIncome, OLD_SLABS);

  // Section 87A rebate: if taxable income ≤ 5L, rebate up to ₹12,500 (old)
  const rebate = taxableIncome <= 500000 ? Math.min(tax, 12500) : 0;
  tax = Math.max(0, tax - rebate);

  const surcharge = calcSurcharge(tax, taxableIncome);
  const cess = (tax + surcharge) * 0.04;
  const totalTax = tax + surcharge + cess;
  return { taxableIncome, stdDed, total80C, total80D, hraEx, otherDed, totalDed, tax, rebate, surcharge, cess, totalTax, breakdown };
}

function fmt(n) {
  return '₹' + Math.round(n).toLocaleString('en-IN');
}

function fmtL(n) {
  if (n >= 10000000) return (n / 10000000).toFixed(2) + ' Cr';
  if (n >= 100000)   return (n / 100000).toFixed(2) + ' L';
  return Math.round(n).toLocaleString('en-IN');
}
