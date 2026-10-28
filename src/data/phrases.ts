import type { PhraseCard } from '../types'

export const phraseCards: PhraseCard[] = [
  {
    id: 'aircon', title: 'The aircon complaint',
    line: 'Eh, level 24 aircon not cold lah, can check?',
    choices: [
      'The air-conditioning on Level 24 appears insufficient. Please investigate and advise on the findings.',
      'The Level 24 compressor has failed. A replacement will be installed within the hour.',
      'Kindly optimise the thermodynamic synergy of our vertical workplace ecosystem.',
    ],
    correctIndex: 0,
    explanation: 'Keep the location, symptom and request. Do not invent a broken part or a repair deadline. Fancy words are not the same as clarity.',
  },
  {
    id: 'room', title: 'The stuffy meeting',
    line: 'Wah, meeting room so stuffy, too many people already.',
    choices: [
      'All occupants are instructed to evacuate immediately due to a confirmed hazardous gas leak.',
      'The meeting has been cancelled and all participants have agreed to a new venue.',
      'The meeting room feels stuffy and may be overcrowded. Please check occupancy and ventilation.',
    ],
    correctIndex: 2,
    explanation: 'Report the observed discomfort and possible overcrowding. A gas leak, cancellation or confirmed diagnosis would be invented.',
  },
  {
    id: 'rent', title: 'The rent reminder',
    line: 'This tenant still owe two months rent leh, better remind them.',
    choices: [
      'We have waived the outstanding rent to preserve the relationship.',
      'Our records show two months of outstanding rent. Please review the balance and issue an appropriate reminder.',
      'The tenant has deliberately refused to pay and legal proceedings have begun.',
    ],
    correctIndex: 1,
    explanation: 'State the recorded balance and next action without assuming intent, waiving money, or inventing legal steps.',
  },
  {
    id: 'power', title: 'The power mismatch',
    line: 'They want more power but site not enough, need confirm first.',
    choices: [
      'The requested power exceeds the listed site capacity. Please confirm feasibility before making a commitment.',
      'The upgrade has been approved and the required capacity is guaranteed.',
      'Please deploy additional positive energy to the premises.',
    ],
    correctIndex: 0,
    explanation: 'Preserve the uncertainty. A request to confirm capacity is not approval for an upgrade.',
  },
  {
    id: 'solar', title: 'The missing commitment',
    line: 'Solar commitment still missing, cannot say everything ready lah.',
    choices: [
      'The application is rejected permanently because the solar panels are defective.',
      'The applicant has verbally agreed, so we have marked the commitment complete.',
      'The solar commitment is still outstanding. Please obtain it before treating the application as complete.',
    ],
    correctIndex: 2,
    explanation: 'Missing evidence means not yet complete. It does not prove rejection, equipment defects, or a verbal agreement.',
  },
  {
    id: 'bid', title: 'The late bid',
    line: 'Highest bid came late leh, must check the rules.',
    choices: [
      'The highest bidder has automatically won because the price is the only criterion.',
      'The highest bid was received after the deadline. Please check the eligibility rules before shortlisting.',
      'We have extended the deadline for all bidders without further approval.',
    ],
    correctIndex: 1,
    explanation: 'Price and eligibility are different checks. Do not award the bid or change the deadline in a rewrite.',
  },
  {
    id: 'tenants', title: 'The tenant heads-up',
    line: 'Chloe flagged the aircon, tell affected tenants first, no promise timing.',
    choices: [
      'Please notify the tenants affected by the air-conditioning issue flagged by Chloe. Do not commit to a repair time until it is confirmed.',
      'All tenants have already been notified that the issue will be resolved by noon.',
      'Please send the entire estate a confirmed shutdown notice.',
    ],
    correctIndex: 0,
    explanation: 'Keep the affected audience and the instruction not to promise a time. Do not turn a draft request into a claim that notices were sent.',
  },
  {
    id: 'lift', title: 'The noisy lift',
    line: 'Lift making funny sound again, ask maintenance to check can?',
    choices: [
      'The lift is certified safe for continued operation without further inspection.',
      'We have replaced all lift components and closed the maintenance case.',
      'An unusual sound has been reported from the lift again. Please arrange for maintenance to investigate.',
    ],
    correctIndex: 2,
    explanation: 'Report the symptom and request investigation. This game cannot certify equipment safety or claim a completed repair.',
  },
]
