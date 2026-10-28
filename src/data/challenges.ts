import type { Challenge } from '../types'

export const challenges: Challenge[] = [
  {
    id: 'ahu',
    title: 'The aircon domino effect',
    shortTitle: 'Air-handler impact',
    persona: "Mei + Chloe's handoff",
    question: 'AHU-24-1 is at risk. Which current tenants need a heads-up?',
    context: 'Follow the air handler to the units it serves, then check the current leases. Old leases and the floor above are distractions.',
    answerLabel: 'Select all affected current tenants',
    files: [
      {
        id: 'inbox', title: 'RE_RE_aircon_update.eml', kind: 'email',
        caption: 'An old email is not the current estate register.',
        columns: ['Thread', 'Message'],
        rows: [
          { id: 'old', cells: ['Old note', 'Tenant D used to occupy 24-02. Please check the current register before contacting anyone.'] },
          { id: 'fault', cells: ['Chloe, today', 'AHU-24-1 needs inspection. Please identify all current tenants it serves. No confirmed outage or repair time yet.'] },
        ],
      },
      {
        id: 'ahu-map', title: 'L24_services_FINAL_v3.plan', kind: 'plan',
        caption: 'Synthetic service map. An asset can serve more than one unit.',
        columns: ['Asset', 'Units served'],
        rows: [
          { id: 'served', cells: ['AHU-24-1', '24-01, 24-02, 24-03'] },
          { id: 'other', cells: ['AHU-25-1', '25-01, 25-02'] },
        ],
      },
      {
        id: 'tenancy', title: 'tenancy_register_CURRENT.xlsx', kind: 'register',
        caption: 'Current and historic leases, as at the fictional scenario date.',
        columns: ['Tenant', 'Unit', 'Lease status'],
        rows: [
          { id: 'a', cells: ['Tenant A', '24-01', 'Current'] },
          { id: 'b', cells: ['Tenant B', '24-02', 'Current'] },
          { id: 'd', cells: ['Tenant D', '24-02', 'Ended - historical only'] },
          { id: 'c', cells: ['Tenant C', '24-03', 'Current'] },
          { id: 'e', cells: ['Tenant E', '25-01', 'Current'] },
        ],
      },
    ],
    options: ['A', 'B', 'C', 'D', 'E'].map((letter) => ({ id: letter, label: `Tenant ${letter}` })),
    correctIds: ['A', 'B', 'C'],
    requiredEvidence: ['ahu-map:served', 'tenancy:a', 'tenancy:b', 'tenancy:c'],
    reference: 'Tenant A (24-01), Tenant B (24-02), and Tenant C (24-03). AHU-24-1 serves these three units. Tenant D is historical; Tenant E is served by a different air handler. This identifies who to notify, not a confirmed outage or repair promise.',
  },
  {
    id: 'transfer',
    title: 'Ready, steady... not quite',
    shortTitle: 'Lease-transfer check',
    persona: "Mei's transfer check",
    question: 'Is case SYN-104 ready? Select the three missing items and the one item to confirm.',
    context: 'A complete-looking cover sheet is not enough. Compare the latest case email, billing record, and power note.',
    answerLabel: 'What still needs attention?',
    files: [
      {
        id: 'cover', title: 'application_cover_FINAL.pdf', kind: 'policy',
        caption: 'Cover sheet, not a final approval.',
        columns: ['Check', 'Recorded status'],
        rows: [
          { id: 'signed', cells: ['Transfer application', 'Signed application received'] },
          { id: 'identity', cells: ['Buyer identity documents', 'Received and checked'] },
          { id: 'rule', cells: ['Desk rule', 'Outstanding rent, approvals and commitments must be resolved. Power capacity must be confirmed. Officers make the decision.'] },
        ],
      },
      {
        id: 'case-mail', title: 'RE_missing_items_latest.eml', kind: 'email',
        caption: 'Latest case review from the fictional case officer.',
        columns: ['Item', 'Latest evidence'],
        rows: [
          { id: 'approval', cells: ['SCDF approval', 'Solvent-store approval not yet received.'] },
          { id: 'solar', cells: ['Solar commitment', 'Buyer has not provided the required written commitment.'] },
          { id: 'handoff', cells: ['Land planning', "Location-rule review has been handed to the planning team; it is not one of this round's three missing documents."] },
        ],
      },
      {
        id: 'billing', title: 'rent_status_latest.xlsx', kind: 'register',
        caption: 'Synthetic billing record, not a payment system.',
        columns: ['Case', 'Status'],
        rows: [
          { id: 'rent', cells: ['SYN-104', 'Two months of rent outstanding. Replacement GIRO mandate alone is not proof of settlement.'] },
          { id: 'other', cells: ['SYN-103', 'Settled - different case'] },
        ],
      },
      {
        id: 'power', title: 'site_power_note.txt', kind: 'email',
        caption: 'A confirmation task is not a confirmed capacity upgrade.',
        columns: ['Item', 'Note'],
        rows: [
          { id: 'capacity', cells: ['Power', 'Buyer requests 2,400 kVA; site lists 1,000 kVA. Infrastructure team must confirm feasibility.'] },
        ],
      },
    ],
    options: [
      { id: 'rent', label: 'Missing: settlement of outstanding rent' },
      { id: 'scdf', label: 'Missing: SCDF solvent-store approval' },
      { id: 'solar', label: 'Missing: written solar commitment' },
      { id: 'power', label: 'To confirm: sufficient power capacity' },
      { id: 'signed', label: 'Missing: signed transfer application' },
      { id: 'identity', label: 'Missing: buyer identity documents' },
    ],
    correctIds: ['rent', 'scdf', 'solar', 'power'],
    requiredEvidence: ['billing:rent', 'case-mail:approval', 'case-mail:solar', 'power:capacity'],
    reference: 'Not ready. Missing: rent settlement, SCDF solvent-store approval, and the written solar commitment. To confirm: whether the requested 2,400 kVA can be supplied when the site lists 1,000 kVA. The signed application and identity documents are already received. The officer must review before any decision.',
  },
  {
    id: 'bids',
    title: 'Biggest bid, small catch',
    shortTitle: 'E-bidding shortlist',
    persona: "Mei's e-bidding review",
    question: 'Who is the provisional highest eligible bidder for unit W-08?',
    context: 'The biggest number is not always the winner. Check the deadline, eligibility and withdrawal status.',
    answerLabel: 'Select one provisional bidder',
    files: [
      {
        id: 'bid-mail', title: 'top_bid_quick_note.eml', kind: 'email',
        caption: 'A quick email can miss the eligibility details.',
        columns: ['Sender', 'Message'],
        rows: [
          { id: 'headline', cells: ['Colleague', 'I saw a $9,200 bid. Is that our winner? Please check the actual register.'] },
        ],
      },
      {
        id: 'rules', title: 'bidding_rules.txt', kind: 'policy',
        caption: 'Simplified fictional rules for this game only.',
        columns: ['Rule', 'Requirement'],
        rows: [
          { id: 'eligible', cells: ['Provisional selection', 'Highest monthly bid that is eligible, not withdrawn, and received by 12:00 on closing day. Officer review is still required.'] },
        ],
      },
      {
        id: 'bids', title: 'W08_bid_register.xlsx', kind: 'register',
        caption: 'All four bids are for the same unit and closing day.',
        columns: ['Bidder', 'Monthly bid', 'Received', 'Status'],
        rows: [
          { id: 'a', cells: ['Tenant A', '$8,400', '11:40', 'Eligible; not withdrawn'] },
          { id: 'b', cells: ['Tenant B', '$8,600', '11:52', 'Eligible; not withdrawn'] },
          { id: 'c', cells: ['Tenant C', '$8,800', '11:48', 'Withdrawn'] },
          { id: 'd', cells: ['Tenant D', '$9,200', '12:04', 'Late; not eligible'] },
        ],
      },
    ],
    options: ['A', 'B', 'C', 'D'].map((letter) => ({ id: letter, label: `Tenant ${letter}` })),
    correctIds: ['B'],
    requiredEvidence: ['rules:eligible', 'bids:b', 'bids:c', 'bids:d'],
    reference: 'Tenant B, at $8,600 per month, is the provisional highest eligible bidder. Tenant C withdrew, and Tenant D was late. Tenant A is eligible but lower. This is a shortlist result, not an award or approval.',
  },
  {
    id: 'leases',
    title: 'The calendar-and-cash chase',
    shortTitle: 'Leases + arrears',
    persona: "Mei's morning review",
    question: 'Which tenants have both an upcoming lease expiry and outstanding rent?',
    context: 'For this round, upcoming means 1 November 2026 through 30 April 2027, inclusive. Ignore expired leases and zero balances.',
    answerLabel: 'Select all tenants meeting both conditions',
    files: [
      {
        id: 'reminder', title: 'last_month_reminder.eml', kind: 'email',
        caption: 'A stale reminder is not the current balance.',
        columns: ['Thread', 'Message'],
        rows: [
          { id: 'old', cells: ['Last month', 'Tenant B was overdue. Please use the latest register; they may have paid since.'] },
        ],
      },
      {
        id: 'window', title: 'morning_review_brief.txt', kind: 'policy',
        caption: 'Use the explicit game window, not the computer clock.',
        columns: ['Filter', 'Definition'],
        rows: [
          { id: 'rule', cells: ['Upcoming + overdue', 'Lease ends from 2026-11-01 through 2027-04-30 inclusive AND current arrears are greater than $0.'] },
        ],
      },
      {
        id: 'lease-register', title: 'lease_balances_CURRENT.xlsx', kind: 'register',
        caption: 'Balances as at 1 November 2026. All entries are fictional.',
        columns: ['Tenant', 'Lease end', 'Outstanding rent'],
        rows: [
          { id: 'a', cells: ['Tenant A', '2027-01-31', '$2,000'] },
          { id: 'b', cells: ['Tenant B', '2027-04-30', '$0'] },
          { id: 'c', cells: ['Tenant C', '2027-03-15', '$500'] },
          { id: 'd', cells: ['Tenant D', '2027-05-01', '$1,000'] },
          { id: 'e', cells: ['Tenant E', '2026-10-31', '$700'] },
        ],
      },
    ],
    options: ['A', 'B', 'C', 'D', 'E'].map((letter) => ({ id: letter, label: `Tenant ${letter}` })),
    correctIds: ['A', 'C'],
    requiredEvidence: ['window:rule', 'lease-register:a', 'lease-register:c'],
    reference: 'Tenant A (31 January 2027; $2,000) and Tenant C (15 March 2027; $500). Both meet the date window and have rent outstanding. Tenant B has paid, Tenant D expires after the window, and Tenant E has already expired.',
  },
]
