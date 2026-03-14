type CashflowPoint = {
  date: Date;
  amount: number;
};

function xnpv(rate: number, cashflows: CashflowPoint[]) {
  if (cashflows.length === 0) {
    return 0;
  }

  const baseDate = cashflows[0].date.getTime();
  return cashflows.reduce((sum, flow) => {
    const years = (flow.date.getTime() - baseDate) / (365 * 24 * 60 * 60 * 1000);
    return sum + flow.amount / Math.pow(1 + rate, years);
  }, 0);
}

export function xirr(cashflows: CashflowPoint[]): number | null {
  if (cashflows.length < 2) {
    return null;
  }

  const hasPositive = cashflows.some((flow) => flow.amount > 0);
  const hasNegative = cashflows.some((flow) => flow.amount < 0);
  if (!hasPositive || !hasNegative) {
    return null;
  }

  let rate = 0.1;
  for (let i = 0; i < 100; i += 1) {
    const value = xnpv(rate, cashflows);
    const derivative = (xnpv(rate + 0.0001, cashflows) - value) / 0.0001;
    if (Math.abs(derivative) < 1e-10) {
      break;
    }
    const nextRate = rate - value / derivative;
    if (!Number.isFinite(nextRate) || nextRate <= -0.9999 || nextRate > 1000) {
      break;
    }
    if (Math.abs(nextRate - rate) < 1e-8) {
      rate = nextRate;
      break;
    }
    rate = nextRate;
  }

  if (!Number.isFinite(rate)) {
    return null;
  }

  return rate;
}

export function computePrivateMarketMetrics(params: {
  contributions: number;
  distributions: number;
  nav: number;
}) {
  const { contributions, distributions, nav } = params;
  if (contributions <= 0) {
    return {
      moic: 0,
      dpi: 0,
      rvpi: 0,
      tvpi: 0,
    };
  }

  const dpi = distributions / contributions;
  const rvpi = nav / contributions;
  const tvpi = dpi + rvpi;

  return {
    moic: tvpi,
    dpi,
    rvpi,
    tvpi,
  };
}
