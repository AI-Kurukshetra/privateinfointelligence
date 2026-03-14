"use client";

import { createInvestor, createCapitalCall, createDistribution, createCashflow, runCalculateDistributionAllocations } from "@/app/(app)/capital/actions";
import { SubmitButton } from "@/components/ui/submit-button";
import { useMemo, useState } from "react";
import { ActionToolbar } from "./action-toolbar";
import { DataTable, type TableColumn } from "./data-table";
import { ModalForm } from "./modal-form";
import { OverviewCard } from "./overview-card";

export type FundInvestorRow = {
  id: string;
  investor_id: string;
  commitment_amount: number;
  paid_in_amount: number;
};

export type InvestorProfile = {
  id: string;
  name: string;
  email: string;
};

export type CapitalCallRow = {
  id: string;
  title: string;
  due_date: string;
  total_amount: number;
  status: string;
};

export type DistributionRow = {
  id: string;
  title: string;
  payment_date: string;
  total_amount: number;
  status: string;
};

export type CashflowRow = {
  id: string;
  flow_type: string;
  occurred_on: string;
  amount: number;
  reference_type: string | null;
  description: string | null;
};

export type AllocationRow = {
  distribution_id: string;
  fund_investor_id: string;
  amount: number;
};

type CapitalDashboardProps = {
  investors: FundInvestorRow[];
  investorProfiles: InvestorProfile[];
  calls: CapitalCallRow[];
  distributions: DistributionRow[];
  cashflows: CashflowRow[];
  allocations: AllocationRow[];
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value || "—";
  }
  return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export function CapitalDashboard({ investors, investorProfiles, calls, distributions, cashflows, allocations }: CapitalDashboardProps) {
  const [isInvestorModalOpen, setInvestorModalOpen] = useState(false);
  const [isCapitalCallModalOpen, setCapitalCallModalOpen] = useState(false);
  const [isDistributionModalOpen, setDistributionModalOpen] = useState(false);
  const [isCashflowModalOpen, setCashflowModalOpen] = useState(false);

  const investorProfilesById = useMemo(() => {
    const map: Record<string, InvestorProfile> = {};
    investorProfiles.forEach((profile) => {
      map[profile.id] = profile;
    });
    return map;
  }, [investorProfiles]);

  const enrichedInvestors = useMemo(
    () =>
      investors.map((investor) => {
        const commitment = Number(investor.commitment_amount ?? 0);
        const paidIn = Number(investor.paid_in_amount ?? 0);
        return {
          ...investor,
          name: investorProfilesById[investor.investor_id]?.name ?? "Investor",
          email: investorProfilesById[investor.investor_id]?.email ?? "—",
          paid_in_amount: paidIn,
          commitment_amount: commitment,
          remaining: Math.max(0, commitment - paidIn),
        };
      }),
    [investors, investorProfilesById]
  );

  const allocationsByDistId = useMemo(() => {
    return allocations.reduce<Record<string, AllocationRow[]>>((acc, allocation) => {
      if (!acc[allocation.distribution_id]) acc[allocation.distribution_id] = [];
      acc[allocation.distribution_id].push(allocation);
      return acc;
    }, {});
  }, [allocations]);

  const totalCommitments = enrichedInvestors.reduce((sum, investor) => sum + investor.commitment_amount, 0);
  const capitalCalled = calls.reduce((sum, call) => sum + call.total_amount, 0);
  const distributionsPaid = distributions.reduce((sum, distribution) => sum + distribution.total_amount, 0);
  const availableLiquidity = Math.max(0, capitalCalled - distributionsPaid);

  const overview = [
    {
      label: "Total Commitments",
      value: formatCurrency(totalCommitments),
      helper: `${enrichedInvestors.length} investors`,
      trend: { label: "Stable" },
    },
    {
      label: "Capital Called",
      value: formatCurrency(capitalCalled),
      helper: `${calls.length} calls`,
      trend: { label: `${calls.length} open`, positive: calls.length > 0 },
    },
    {
      label: "Distributions Paid",
      value: formatCurrency(distributionsPaid),
      helper: `${distributions.length} payouts`,
      trend: { label: distributionsPaid > 0 ? "On track" : "Pending" },
    },
    {
      label: "Available Liquidity",
      value: formatCurrency(availableLiquidity),
      helper: "Calls minus distributions",
      trend: { label: availableLiquidity >= 0 ? "Positive" : "Negative", positive: availableLiquidity >= 0 },
    },
  ];

  const investorColumns: TableColumn<typeof enrichedInvestors[number]>[] = [
    {
      header: "Investor Name",
      accessor: "name",
      sortable: true,
      render: (row) => <span className="font-semibold text-slate-900 dark:text-white">{row.name}</span>,
    },
    { header: "Email", accessor: "email", sortable: true },
    {
      header: "Commitment",
      accessor: "commitment_amount",
      sortable: true,
      align: "right",
      render: (row) => formatCurrency(row.commitment_amount),
    },
    {
      header: "Capital Called",
      accessor: "paid_in_amount",
      sortable: true,
      align: "right",
      render: (row) => formatCurrency(row.paid_in_amount),
    },
    {
      header: "Remaining",
      accessor: "remaining",
      sortable: true,
      align: "right",
      render: (row) => formatCurrency(Math.max(0, row.commitment_amount - row.paid_in_amount)),
    },
    {
      header: "Actions",
      accessor: "actions",
      render: () => <span className="text-xs text-slate-500">—</span>,
    },
  ];

  const capitalCallColumns: TableColumn<CapitalCallRow>[] = [
    { header: "Call Title", accessor: "title", sortable: true },
    {
      header: "Date",
      accessor: "due_date",
      sortable: true,
      render: (row) => formatDate(row.due_date),
    },
    {
      header: "Total Amount",
      accessor: "total_amount",
      sortable: true,
      align: "right",
      render: (row) => formatCurrency(row.total_amount),
    },
    { header: "Status", accessor: "status", sortable: true },
  ];

  const distributionColumns: TableColumn<DistributionRow>[] = [
    { header: "Distribution Title", accessor: "title", sortable: true },
    {
      header: "Date",
      accessor: "payment_date",
      sortable: true,
      render: (row) => formatDate(row.payment_date),
    },
    {
      header: "Amount",
      accessor: "total_amount",
      sortable: true,
      align: "right",
      render: (row) => formatCurrency(row.total_amount),
    },
    { header: "Status", accessor: "status", sortable: true },
    {
      header: "Allocation Type",
      accessor: "allocation_type",
      render: (row) => (allocationsByDistId[row.id]?.length ? "Automated" : "Manual"),
    },
    {
      header: "Actions",
      accessor: "actions",
      render: (row) =>
        row.status === "draft" ? (
          <form action={runCalculateDistributionAllocations} className="flex justify-end">
            <input type="hidden" name="distribution_id" value={row.id} />
            <SubmitButton variant="secondary">Calc allocations</SubmitButton>
          </form>
        ) : (
          <span className="text-xs text-slate-500">—</span>
        ),
    },
  ];

  const cashflowColumns: TableColumn<CashflowRow>[] = [
    { header: "Type", accessor: "flow_type", sortable: true },
    {
      header: "Date",
      accessor: "occurred_on",
      sortable: true,
      render: (row) => formatDate(row.occurred_on),
    },
    {
      header: "Amount",
      accessor: "amount",
      sortable: true,
      align: "right",
      render: (row) => formatCurrency(row.amount),
    },
    { header: "Reference", accessor: "reference_type" },
    { header: "Description", accessor: "description" },
  ];

  return (
    <div className="space-y-10">
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {overview.map((card) => (
          <OverviewCard key={card.label} {...card} />
        ))}
      </section>

      <section className="space-y-6">
        <ActionToolbar
          actions={[
            {
              id: "add-investor",
              label: "Add investor",
              description: "Record new LP commitments",
              variant: "primary",
              onClick: () => setInvestorModalOpen(true),
            },
            {
              id: "create-call",
              label: "Create capital call",
              description: "Issue a payment notice",
              variant: "secondary",
              onClick: () => setCapitalCallModalOpen(true),
            },
            {
              id: "record-distribution",
              label: "Record distribution",
              description: "Log payouts and allocations",
              variant: "secondary",
              onClick: () => setDistributionModalOpen(true),
            },
            {
              id: "add-cashflow",
              label: "Add cashflow entry",
              description: "Track any cash movement",
              variant: "secondary",
              onClick: () => setCashflowModalOpen(true),
            },
          ]}
        />
      </section>

      <section className="space-y-6">
        <DataTable
          title="Investors"
          columns={investorColumns}
          data={enrichedInvestors}
          emptyState={{
            message: "No investors created yet.",
            actionLabel: "Add investor",
            onAction: () => setInvestorModalOpen(true),
          }}
        />

        <DataTable
          title="Capital calls"
          columns={capitalCallColumns}
          data={calls}
          emptyState={{
            message: "No capital calls created yet",
            actionLabel: "Create capital call",
            onAction: () => setCapitalCallModalOpen(true),
          }}
        />

        <DataTable
          title="Distributions"
          columns={distributionColumns}
          data={distributions}
          emptyState={{
            message: "No distributions recorded yet",
            actionLabel: "Record distribution",
            onAction: () => setDistributionModalOpen(true),
          }}
        />

        <DataTable
          title="Cashflow"
          columns={cashflowColumns}
          data={cashflows}
          emptyState={{
            message: "No cashflow entries yet",
            actionLabel: "Add cashflow",
            onAction: () => setCashflowModalOpen(true),
          }}
        />
      </section>

      <ModalForm open={isInvestorModalOpen} onClose={() => setInvestorModalOpen(false)} title="Add investor">
        <form action={createInvestor} className="space-y-4">
          <input className="ui-input" name="name" placeholder="Investor name" required />
          <input className="ui-input" type="email" name="email" placeholder="Investor email" required />
          <input className="ui-input" type="number" name="commitment_amount" placeholder="Commitment amount" step="0.01" required />
          <input className="ui-input" name="currency_code" defaultValue="USD" />
          <SubmitButton className="w-full">Save investor</SubmitButton>
        </form>
      </ModalForm>

      <ModalForm open={isCapitalCallModalOpen} onClose={() => setCapitalCallModalOpen(false)} title="Create capital call">
        <form action={createCapitalCall} className="space-y-4">
          <input className="ui-input" name="title" placeholder="Call title" required />
          <div className="grid grid-cols-2 gap-3">
            <input className="ui-input" type="date" name="due_date" required />
            <input className="ui-input" type="number" name="total_amount" placeholder="Total amount" step="0.01" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input className="ui-input" name="currency_code" defaultValue="USD" />
            <select className="ui-select" name="status" defaultValue="draft">
              <option value="draft">draft</option>
              <option value="issued">issued</option>
              <option value="partially_paid">partially_paid</option>
              <option value="paid">paid</option>
            </select>
          </div>
          <SubmitButton className="w-full">Save capital call</SubmitButton>
        </form>
      </ModalForm>

      <ModalForm open={isDistributionModalOpen} onClose={() => setDistributionModalOpen(false)} title="Record distribution">
        <form action={createDistribution} className="space-y-4">
          <input className="ui-input" name="title" placeholder="Distribution title" required />
          <div className="grid grid-cols-2 gap-3">
            <input className="ui-input" type="date" name="payment_date" required />
            <input className="ui-input" type="number" name="total_amount" placeholder="Total amount" step="0.01" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input className="ui-input" name="currency_code" defaultValue="USD" />
            <select className="ui-select" name="status" defaultValue="draft">
              <option value="draft">draft</option>
              <option value="approved">approved</option>
              <option value="paid">paid</option>
              <option value="cancelled">cancelled</option>
            </select>
          </div>
          <select className="ui-select" name="allocation_type" defaultValue="automated">
            <option value="automated">Automated waterfall</option>
            <option value="manual">Manual</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-slate-500">
            <input type="checkbox" name="auto_allocate" value="true" className="h-4 w-4 rounded border-slate-300 text-blue-600" />
            Auto-allocate pro-rata by commitment
          </label>
          <SubmitButton className="w-full">Save distribution</SubmitButton>
        </form>
      </ModalForm>

      <ModalForm open={isCashflowModalOpen} onClose={() => setCashflowModalOpen(false)} title="Add cashflow entry">
        <form action={createCashflow} className="space-y-4">
          <select className="ui-select" name="flow_type" defaultValue="capital_call">
            <option value="capital_call">Capital call</option>
            <option value="distribution">Distribution</option>
            <option value="investment">Investment</option>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
            <option value="fee">Fee</option>
          </select>
          <div className="grid grid-cols-2 gap-3">
            <input className="ui-input" type="date" name="occurred_on" required />
            <input className="ui-input" type="number" name="amount" placeholder="Amount" step="0.01" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input className="ui-input" name="currency_code" defaultValue="USD" />
            <input className="ui-input" name="reference_type" placeholder="Reference" />
          </div>
          <textarea className="ui-input h-24 resize-none" name="description" placeholder="Description" />
          <SubmitButton className="w-full">Save cashflow</SubmitButton>
        </form>
      </ModalForm>
    </div>
  );
}
