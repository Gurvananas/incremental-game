import { RESOURCE_IDS } from '../src/data/resources';
import { runSimulation } from './simulate';

/** Usage: npm run sim -- --days=800 --seed=42 */
function numberArg(name: string, fallback: number): number {
  const prefix = `--${name}=`;
  const raw = process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
  const value = raw === undefined ? fallback : Number(raw);
  if (!Number.isFinite(value)) {
    throw new Error(`Invalid --${name}: ${raw}`);
  }
  return value;
}

const days = numberArg('days', 800);
const seed = numberArg('seed', 1);
const report = runSimulation({ seed, days });

console.log(`Sylve simulation: ${days} days, seed ${seed}`);
console.table(
  report.samples.map(({ date, resources }) => ({
    date: `Y${date.year} ${date.season}`,
    ...Object.fromEntries(RESOURCE_IDS.map((id) => [id, resources[id].toFixed(2)])),
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
