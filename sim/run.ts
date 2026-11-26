import { DISCOVERY_IDS } from '../src/data/discoveries';
import { ERAS } from '../src/data/eras';
import { PLANT_IDS } from '../src/data/plants';
import { RESOURCE_IDS } from '../src/data/resources';
import { SPECIES_IDS } from '../src/data/species';
import { runSimulation } from './simulate';

/** Usage: npm run sim -- --minutes=60 --seed=42 */
function numberArg(name: string, fallback: number): number {
  const prefix = `--${name}=`;
  const raw = process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
  const value = raw === undefined ? fallback : Number(raw);
  if (!Number.isFinite(value)) {
    throw new Error(`Invalid --${name}: ${raw}`);
  }
  return value;
}

function clock(seconds: number | undefined): string {
  if (seconds === undefined) {
    return 'not reached';
  }
  const m = Math.floor(seconds / 60);
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

const minutes = numberArg('minutes', 480);
const seed = numberArg('seed', 1);
const report = runSimulation({ seed, seconds: minutes * 60 });
const { milestones } = report;

console.log(`Sylve simulation: ${minutes} min, seed ${seed}\n`);
console.log('Milestones (real time, m:ss)');
console.log(`  first plantation   ${clock(milestones.firstPlant)}`);
for (const id of DISCOVERY_IDS) {
  console.log(`  ${id.padEnd(18)} ${clock(milestones.discoveries[id])}`);
}
for (const era of ERAS.filter((e) => e > 1)) {
  console.log(`  era ${String(era).padEnd(14)} ${clock(milestones.eras[era])}`);
}
console.log('First individual of each species');
for (const id of SPECIES_IDS) {
  console.log(`  ${id.padEnd(18)} ${clock(milestones.species[id])}`);
}
console.log(
  `Longest wait without buying: ${clock(milestones.longestWait)} (from ${clock(milestones.longestWaitFrom)})`,
);

console.log('\nStart of each season');
console.table(
  report.samples.map(({ second, date, state }) => ({
    time: clock(second),
    date: `Y${date.year} ${date.season}`,
    ...Object.fromEntries(RESOURCE_IDS.map((id) => [id, state.resources[id].toFixed(1)])),
    ...Object.fromEntries(PLANT_IDS.map((id) => [id, state.plants[id]])),
    ...Object.fromEntries(SPECIES_IDS.map((id) => [id, Math.floor(state.animals[id])])),
  })),
);

if (report.violations.length > 0) {
  console.error(`${report.violations.length} invariant violation(s):`);
  for (const violation of report.violations.slice(0, 20)) {
    console.error(`  ${violation}`);
  }
  process.exitCode = 1;
} else {
  console.log('All invariants hold.');
}
