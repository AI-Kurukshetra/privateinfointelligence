import {
  createCapitalCall,
  createCashflow,
  createDistribution,
  createInvestor,
} from "@/app/(app)/capital/actions";
import { PageHeader, SectionCard } from "@/components/ui/blocks";
import { requireActiveFund } from "@/lib/fund/active";
import { createClient } from "@/lib/supabase/server";

export default async function CapitalPage() {
  const { fundId } = await requireActiveFund();
  const supabase = await createClient();

  const [{ data: investors }, { data: investorProfiles }, { data: calls }, { data: distributions }, { data: cashflows }] =
    await Promise.all([
      supabase
        .from("fund_investors")
        .select("id, investor_id, commitment_amount, paid_in_amount")
        .eq("fund_id", fundId)
        .order("created_at", { ascending: false }),
      supabase.from("investors").select("id, name, email"),
      supabase
        .from("capital_calls")
        .select("id, title, due_date, total_amount, status")
        .eq("fund_id", fundId)
        .order("created_at", { ascending: false }),
      supabase
        .from("distributions")
        .select("id, title, payment_date, total_amount, status")
        .eq("fund_id", fundId)
        .order("created_at", { ascending: false }),
      supabase
        .from("cashflows")
        .select("id, flow_type, occurred_on, amount, description")
        .eq("fund_id", fundId)
        .order("occurred_on", { ascending: false }),
    ]);

  const investorNameById = new Map((investorProfiles ?? []).map((investor) => [investor.id, investor.name]));

  return (
    <div className="ui-page">
      <PageHeader
        title="Capital and Cashflow"
        subtitle="Manage investors, commitments, capital events, distributions, and liquidity."
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="Add Fund Investor" subtitle="Commitment and LP records">
          <form action={createInvestor} className="ui-form-grid two">
            <input className="ui-input" name="name" placeholder="Investor name" required />
            <input className="ui-input" type="email" name="email" placeholder="Investor email" required />
            <input
              className="ui-input"
              type="number"
              step="0.01"
              name="commitment_amount"
              placeholder="Commitment amount"
              required
            />
            <input className="ui-input" name="currency_code" defaultValue="USD" />
            <button className="ui-btn ui-btn-primary xl:col-span-2" type="submit">
              Save Investor
            </button>
          </form>
        </SectionCard>

        <SectionCard title="Create Capital Call" subtitle="Issue call notices and track status">
          <form action={createCapitalCall} className="ui-form-grid two">
            <input className="ui-input xl:col-span-2" name="title" placeholder="Call title" required />
            <input className="ui-input" type="date" name="due_date" required />
            <input className="ui-input" type="number" step="0.01" name="total_amount" placeholder="Total amount" required />
            <input className="ui-input" name="currency_code" defaultValue="USD" />
            <select className="ui-select" name="status" defaultValue="draft">
              <option value="draft">draft</option>
              <option value="issued">issued</option>
              <option value="partially_paid">partially_paid</option>
              <option value="paid">paid</option>
            </select>
            <button className="ui-btn ui-btn-primary xl:col-span-2" type="submit">
              Save Capital Call
            </button>
          </form>
        </SectionCard>

        <SectionCard title="Create Distribution" subtitle="LP payouts and waterfall events">
          <form action={createDistribution} className="ui-form-grid two">
            <input className="ui-input xl:col-span-2" name="title" placeholder="Distribution title" required />
            <input className="ui-input" type="date" name="payment_date" required />
            <input className="ui-input" type="number" step="0.01" name="total_amount" placeholder="Total amount" required />
            <input className="ui-input" name="currency_code" defaultValue="USD" />
            <select className="ui-select" name="status" defaultValue="draft">
              <option value="draft">draft</option>
              <option value="approved">approved</option>
              <option value="paid">paid</option>
              <option value="cancelled">cancelled</option>
            </select>
            <button className="ui-btn ui-btn-primary xl:col-span-2" type="submit">
              Save Distribution
            </button>
          </form>
        </SectionCard>

        <SectionCard title="Add Cashflow Entry" subtitle="Input stream for performance calculations">
          <form action={createCashflow} className="ui-form-grid two">
            <select className="ui-select" name="flow_type" defaultValue="capital_call">
              <option value="capital_call">capital_call</option>
              <option value="distribution">distribution</option>
              <option value="investment">investment</option>
              <option value="expense">expense</option>
              <option value="income">income</option>
              <option value="fee">fee</option>
            </select>
            <input className="ui-input" type="date" name="occurred_on" required />
            <input className="ui-input" type="number" step="0.01" name="amount" placeholder="Amount" required />
            <input className="ui-input" name="currency_code" defaultValue="USD" />
            <input className="ui-input" name="reference_type" placeholder="Reference type" />
            <input className="ui-input" name="description" placeholder="Description" />
            <button className="ui-btn ui-btn-primary xl:col-span-2" type="submit">
              Save Cashflow
            </button>
          </form>
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="Investors" subtitle="Commitment and paid-in tracking">
          <div className="ui-table-wrap">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Investor</th>
                  <th>Commitment</th>
                  <th>Paid-in</th>
                </tr>
              </thead>
              <tbody>
                {(investors ?? []).map((investor) => (
                  <tr key={investor.id}>
                    <td>{investorNameById.get(investor.investor_id) ?? "Investor"}</td>
                    <td>{Number(investor.commitment_amount).toLocaleString()}</td>
                    <td>{Number(investor.paid_in_amount ?? 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title="Capital Calls" subtitle="Call lifecycle and due dates">
          <div className="ui-table-wrap">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Due Date</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(calls ?? []).map((call) => (
                  <tr key={call.id}>
                    <td>{call.title}</td>
                    <td>{call.due_date}</td>
                    <td>{Number(call.total_amount).toLocaleString()}</td>
                    <td>{call.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="Distributions" subtitle="Distribution events">
          <div className="ui-table-wrap">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Payment Date</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(distributions ?? []).map((distribution) => (
                  <tr key={distribution.id}>
                    <td>{distribution.title}</td>
                    <td>{distribution.payment_date}</td>
                    <td>{Number(distribution.total_amount).toLocaleString()}</td>
                    <td>{distribution.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title="Cashflows" subtitle="Liquidity timeline">
          <div className="ui-table-wrap">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {(cashflows ?? []).map((cashflow) => (
                  <tr key={cashflow.id}>
                    <td>{cashflow.occurred_on}</td>
                    <td>{cashflow.flow_type}</td>
                    <td>{Number(cashflow.amount).toLocaleString()}</td>
                    <td>{cashflow.description ?? "-"}</td>
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
