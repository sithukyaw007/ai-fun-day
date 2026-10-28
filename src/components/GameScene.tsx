import { CalendarDays, CircleHelp, FileCheck2, Hand, LockKeyhole, Mail, Mic, ShieldCheck, Sun, WalletCards, Zap } from 'lucide-react'

function Person({ x, y }: { x: number; y: number }) {
  return <g transform={`translate(${x} ${y})`}><circle className="art-paper" cx={0} cy={-22} r={13} /><path className="art-soft" d="M-23 27V5Q-23-8 0-8T23 5V27Z" /><path d="M-4-24h1m7 0h1" /></g>
}

function Building() {
  return <g><path className="art-paper" d="M224 169V39L288 21L352 39V169Z" /><path d="M288 22v147M214 169h148M226 78h123M226 120h123" />
    {[0, 1, 2].map((row) => [0, 1, 2, 3].map((col) => <rect key={`${row}-${col}`} className={row === 1 ? 'art-soft' : 'art-window'} x={239 + col * 27} y={49 + row * 42} width={13} height={19} rx={2} />))}
    <path d="M278 169v-23h20v23" />
  </g>
}

function FanUnit({ x = 68, y = 55 }: { x?: number; y?: number }) {
  return <g transform={`translate(${x} ${y})`}><rect className="art-paper" width={92} height={78} rx={12} /><circle className="art-soft" cx={46} cy={36} r={26} /><g className="scene-fan"><path d="M46 36Q21 20 34 14Q50 8 46 36ZM46 36Q73 22 74 36Q73 53 46 36ZM46 36Q45 66 32 58Q18 48 46 36Z" /></g><circle className="art-paper" cx={46} cy={36} r={4} /><path d="M14 67h64" /></g>
}

export default function GameScene({ scene }: { scene: string }) {
  const estate = ['ahu', 'tenants', 'connections', 'aircon'].includes(scene)
  const calendar = ['leases', 'freshness'].includes(scene)
  const money = ['rent', 'bids', 'bid'].includes(scene)
  const room = scene === 'room' || scene === 'co2'
  const robot = ['confidence', 'unknown', 'oversight'].includes(scene)
  return <svg className="game-scene" data-scene={scene} viewBox="0 0 440 190" aria-hidden="true">
    <ellipse className="art-ground" cx={220} cy={172} rx={185} ry={9} />
    {estate ? <>
      <FanUnit /><Building /><path className="art-flow" d="M164 95H214" /><path d="m205 89 9 6-9 6" />
      <text x={114} y={154} textAnchor="middle">AHU-24-1</text><text x={288} y={14} textAnchor="middle">THE ESTATE</text>
      <path className="art-soft" d="M371 80h37v35h-37z" /><Person x={390} y={144} />
    </> : scene === 'chiller' ? <>
      <rect className="art-paper" x={72} y={45} width={286} height={112} rx={16} /><FanUnit x={91} y={58} /><FanUnit x={242} y={58} />
      <path className="art-flow" d="M40 143V96h31M359 96h33v47" /><text x={220} y={31} textAnchor="middle">CHILLER CH-2</text>
    </> : room ? <>
      <rect className="art-paper" x={68} y={25} width={310} height={135} rx={12} /><path className="art-soft" d="M125 122h200l-20 27H145Z" />
      <Person x={144} y={99} /><Person x={220} y={86} /><Person x={298} y={99} />
      <path className="art-flow" d="M97 52q13-20 26 0t26 0M281 49q13-20 26 0t26 0" /><text x={220} y={48} textAnchor="middle">CO2 ?</text>
    </> : calendar ? <>
      <rect className="art-paper" x={71} y={31} width={162} height={132} rx={12} /><path className="art-soft" d="M71 68V43q0-12 12-12h138q12 0 12 12v25Z" /><path d="M107 20v24M197 20v24" />
      {[0, 1, 2].map((row) => [0, 1, 2, 3].map((col) => <rect key={`${row}-${col}`} className="art-window" x={89 + col * 34} y={84 + row * 23} width={14} height={10} rx={2} />))}
      {scene === 'freshness' ? <><circle className="art-soft" cx={310} cy={110} r={45} /><path d="M310 80v31l23 13" /><text x={310} y={48} textAnchor="middle">LAST UPDATE?</text></> : <><WalletCards x={280} y={57} size={75} /><text x={318} y={154} textAnchor="middle">RENT OWED?</text></>}
    </> : money ? <>
      <path className="art-paper" d="M73 151V91h62v60ZM159 151V65h62v86ZM245 151V39h62v112Z" /><path className="art-soft" d="M245 151V39h62v112Z" /><path d="M53 152h275" />
      <text x={104} y={80} textAnchor="middle">$</text><text x={190} y={53} textAnchor="middle">$</text><text x={276} y={27} textAnchor="middle">$</text>
      <CalendarDays x={337} y={73} size={54} /><text x={363} y={151} textAnchor="middle">{scene === 'bids' ? '12:00' : scene === 'bid' ? 'LATE?' : '2 MONTHS'}</text>
    </> : scene === 'noise' ? <>
      <rect className="art-paper" x={54} y={30} width={332} height={126} rx={12} /><path className="art-grid" d="M75 61h290M75 96h290M75 131h290" /><path className="art-pulse" d="M76 120l30-4 30 7 28-5 24-61 24 63 28-2 28 4 28-4 33 2 34-2" /><CircleHelp x={313} y={41} size={34} />
    </> : robot ? <>
      <rect className="art-soft" x={66} y={47} width={116} height={94} rx={24} /><path d="M123 46V30M99 142v18M149 142v18M65 87H50M183 87h15" /><circle className="art-paper" cx={123} cy={23} r={6} /><circle cx={101} cy={86} r={7} /><circle cx={148} cy={86} r={7} /><path d="M105 115h38" />
      <path className="art-paper" d="M239 33h135v92H269l-24 23v-23h-6Z" />
      {scene === 'oversight' ? <><FileCheck2 x={267} y={46} size={58} /><Hand x={337} y={130} size={37} /></> : <text className="art-big-text" x={306} y={94} textAnchor="middle">{scene === 'unknown' ? '?' : '!!!'}</text>}
    </> : scene === 'voice' ? <>
      <Mic x={84} y={50} size={85} /><path className="art-flow" d="M185 92h66" /><path d="m241 86 10 6-10 6" /><path className="art-paper" d="M280 117q-30-4-25-30q2-18 25-18q7-35 39-25q20 3 26 26q33-1 35 23q0 24-30 24Z" /><text x={317} y={146} textAnchor="middle">PROVIDER?</text>
    </> : scene === 'access' ? <>
      {[80, 190, 300].map((x) => <g key={x}><rect className="art-paper" x={x} y={47} width={75} height={107} rx={9} /><path d={`M${x + 14} 70h47M${x + 14} 84h33`} /><LockKeyhole x={x + 20} y={101} size={36} /></g>)}
      <text x={228} y={27} textAnchor="middle">WHO CAN SEE WHAT?</text>
    </> : scene === 'lift' ? <>
      <rect className="art-paper" x={112} y={24} width={206} height={141} rx={8} /><path className="art-soft" d="M131 55h168v110H131Z" /><path d="M215 56v108M160 38h112" /><path className="art-pulse" d="m70 85-13 13 13 13M367 85l13 13-13 13" />
    </> : scene === 'solar' ? <>
      <Sun x={290} y={13} size={61} /><path className="art-paper" d="m94 148 28-89h180l29 89ZM122 59l180 89M302 59l-180 89M107 103h209M166 59l-11 89M258 59l12 89" /><FileCheck2 x={337} y={110} size={42} />
    </> : scene === 'power' ? <>
      <rect className="art-paper" x={69} y={51} width={118} height={103} rx={15} /><Zap className="art-icon-accent" x={100} y={67} size={58} /><path className="art-flow" d="M198 103h43" /><rect className="art-soft" x={257} y={51} width={118} height={103} rx={15} /><Zap x={288} y={67} size={58} /><text x={128} y={33} textAnchor="middle">LISTED</text><text x={316} y={33} textAnchor="middle">REQUESTED?</text>
    </> : <>
      <rect className="art-paper" x={78} y={28} width={137} height={138} rx={12} /><path d="M103 59h84M103 85h57M103 111h73M103 137h45" /><ShieldCheck className="art-icon-accent" x={247} y={56} size={80} /><Mail x={329} y={128} size={44} />
    </>}
  </svg>
}
