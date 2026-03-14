import {
  createDeal,
  createInvestment,
  createPortfolioCompany,
  createValuation,
} from "@/app/(app)/portfolio/actions";
import { PageHeader, SectionCard } from "@/components/ui/blocks";
import { requireActiveFund } from "@/lib/fund/active";
import { createClient } from "@/lib/supabase/server";

export default async function PortfolioPage() {
  const { fundId } = await requireActiveFund();
  const supabase = await createClient();

  const [{ data: companies }, { data: investments }, { data: valuations }, { data: deals }] = await Promise.all([
    supabase
      .from("portfolio_companies")
      .select("id, name, sector, stage, country, created_at")
      .eq("fund_id", fundId)
      .order("created_at", { ascending: false }),
    supabase
      .from("investments")
      .select("id, portfolio_company_id, invested_amount, ownership_percentage, investment_date")
      .eq("fund_id", fundId)
      .order("investment_date", { ascending: false }),
    supabase
      .from("valuations")
      .select("id, investment_id, as_of_date, fair_value, method, status")
      .eq("fund_id", fundId)
      .order("as_of_date", { ascending: false }),
    supabase
      .from("deals")
      .select("id, company_name, stage, target_amount, probability_pct")
      .eq("fund_id", fundId)
      .order("created_at", { ascending: false }),
  ]);

  const companyNameById = new Map((companies ?? []).map((company) => [company.id, company.name]));

  return (
    <div className="ui-page">
      <PageHeader
        title="Portfolio and Pipeline"
        subtitle="Track portfolio companies, deal stages, investments, and valuation history."
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="Add Portfolio Company" subtitle="Core portfolio management record">
          <form action={createPortfolioCompany} className="ui-form-grid two">
            <input className="ui-input" name="name" placeholder="Company name" required />
            <input className="ui-input" name="sector" placeholder="Sector" required />
            <select className="ui-select" name="stage" defaultValue="pipeline">
              <option value="pipeline">pipeline</option>
              <option value="active">active</option>
              <option value="exited">exited</option>
            </select>
            <input className="ui-input" name="country" placeholder="Country code (US)" />
            <button className="ui-btn ui-btn-primary xl:col-span-2" type="submit">
              Save Company
            </button>
          </form>
        </SectionCard>

        <SectionCard title="Deal Pipeline" subtitle="From sourcing through diligence and close">
          <form action={createDeal} className="ui-form-grid two">
            <input className="ui-input" name="company_name" placeholder="Target company" required />
            <input className="ui-input" name="sector" placeholder="Sector" />
            <select className="ui-select" name="stage" defaultValue="sourced">
              <option value="sourced">sourced</option>
              <option value="screening">screening</option>
              <option value="diligence">diligence</option>
              <option value="ic_review">ic_review</option>
              <option value="approved">approved</option>
              <option value="closed">closed</option>
              <option value="rejected">rejected</option>
            </select>
            <input className="ui-input" type="number" step="0.01" name="target_amount" placeholder="Target amount" />
            <input className="ui-input" type="number" step="0.01" name="probability_pct" placeholder="Probability %" />
            <input className="ui-input" type="date" name="expected_close_date" />
            <textarea className="ui-textarea xl:col-span-2" name="notes" placeholder="Deal notes" />
            <button className="ui-btn ui-btn-primary xl:col-span-2" type="submit">
              Save Deal
            </button>
          </form>
        </SectionCard>

        <SectionCard title="Add Investment" subtitle="Track invested amount and ownership">
          <form action={createInvestment} className="ui-form-grid two">
            <select className="ui-select xl:col-span-2" name="portfolio_company_id" required>
              <option value="">Select portfolio company</option>
              {(companies ?? []).map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
            <input className="ui-input" type="number" step="0.01" name="invested_amount" placeholder="Invested amount" required />
            <input className="ui-input" type="number" step="0.01" name="ownership_percentage" placeholder="Ownership %" required />
            <input className="ui-input" type="date" name="investment_date" required />
            <input className="ui-input" name="currency_code" defaultValue="USD" />
            <button className="ui-btn ui-btn-primary xl:col-span-2" type="submit">
              Save Investment
            </button>
          </form>
        </SectionCard>

        <SectionCard title="Add Valuation" subtitle="Methodology and publication workflow">
          <form action={createValuation} className="ui-form-grid two">
            <select className="ui-select xl:col-span-2" name="investment_id" required>
              <option value="">Select investment</option>
              {(investments ?? []).map((investment) => (
                <option key={investment.id} value={investment.id}>
                  {companyNameById.get(investment.portfolio_company_id) ?? "Company"} •{" "}
                  {Number(investment.invested_amount).toLocaleString()}
                </option>
              ))}
            </select>
            <input className="ui-input" type="date" name="as_of_date" required />
            <input className="ui-input" type="number" step="0.01" name="fair_value" placeholder="Fair value" required />
            <input className="ui-input" name="method" placeholder="Valuation method" required />
            <select className="ui-select" name="status" defaultValue="draft">
              <option value="draft">draft</option>
              <option value="approved">approved</option>
              <option value="published">published</option>
            </select>
            <button className="ui-btn ui-btn-primary xl:col-span-2" type="submit">
              Save Valuation
            </button>
          </form>
        </SectionCard>
      </div>

      <SectionCard title="Portfolio Companies" subtitle="Current company universe">
        <div className="ui-table-wrap">
          <table className="ui-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Sector</th>
                <th>Stage</th>
                <th>Country</th>
              </tr>
            </thead>
            <tbody>
              {(companies ?? []).map((company) => (
                <tr key={company.id}>
                  <td>{company.name}</td>
                  <td>{company.sector}</td>
                  <td>{company.stage}</td>
                  <td>{company.country ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="Deal Pipeline" subtitle="Prioritized opportunities">
          <div className="ui-table-wrap">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Stage</th>
                  <th>Target</th>
                  <th>Probability</th>
                </tr>
              </thead>
              <tbody>
                {(deals ?? []).map((deal) => (
                  <tr key={deal.id}>
                    <td>{deal.company_name}</td>
                    <td>{deal.stage}</td>
                    <td>{deal.target_amount ? Number(deal.target_amount).toLocaleString() : "-"}</td>
                    <td>{deal.probability_pct ? `${deal.probability_pct}%` : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title="Recent Valuations" subtitle="Published values drive analytics">
          <div className="ui-table-wrap">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>As of</th>
                  <th>Fair Value</th>
                  <th>Method</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(valuations ?? []).map((valuation) => (
                  <tr key={valuation.id}>
                    <td>{valuation.as_of_date}</td>
                    <td>{Number(valuation.fair_value).toLocaleString()}</td>
                    <td>{valuation.method}</td>
                    <td>{valuation.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
