/**
 * Optional hardening pass that runs AFTER `ng build --configuration production`.
 *
 * What this does:
 * - Renames variables/functions to meaningless identifiers (beyond Angular's
 *   own minification, which already does this but more conservatively)
 * - Encodes string literals into a lookup array
 * - Adds light control-flow flattening and dead-code injection
 *
 * What this does NOT do:
 * - Make the code "unreadable" in any absolute sense - a browser must still
 *   execute it, and a sufficiently motivated person can always run it
 *   through a deobfuscator or just observe its behavior at runtime.
 * - Protect anything that matters for security. Pricing, stock checks,
 *   coupon validation, and payment verification all already happen
 *   server-side in this project specifically so that obfuscating (or even
 *   fully hiding) the frontend would change nothing for an attacker trying
 *   to cheat a price or fake a payment.
 *
 * What it's actually good for:
 * - Raising the effort required for someone to skim your bundle, lift your
 *   component structure/business copy, and reuse it wholesale in a clone.
 *
 * Trade-offs to know about before using this in production:
 * - Obfuscated bundles are larger and slightly slower to parse/execute
 *   (control-flow flattening especially has a real runtime cost).
 * - Stack traces in error monitoring (Sentry etc.) become useless unless
 *   you separately store the un-obfuscated source maps privately.
 * - Test the obfuscated build thoroughly before shipping - aggressive
 *   obfuscation settings occasionally break edge-case runtime behavior.
 *
 * Usage: npm run build:secure
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DIST_DIR = path.join(__dirname, '..', 'dist', 'trackhub-frontend', 'browser');

function findJsFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...findJsFiles(full));
    } else if (entry.name.endsWith('.js') && !entry.name.endsWith('.js.map')) {
      out.push(full);
    }
  }
  return out;
}

if (!fs.existsSync(DIST_DIR)) {
  console.error(`Build output not found at ${DIST_DIR}. Run "ng build --configuration production" first.`);
  process.exit(1);
}

const files = findJsFiles(DIST_DIR);
console.log(`Obfuscating ${files.length} JS file(s) in ${DIST_DIR} ...`);

const bin = path.join(__dirname, '..', 'node_modules', '.bin', 'javascript-obfuscator');

for (const file of files) {
  // Moderate preset: meaningful protection without the heaviest (and
  // slowest-at-runtime) options like deep control-flow flattening on every
  // function, which would noticeably hurt page performance for a storefront.
  const cmd = [
    `"${bin}"`,
    `"${file}"`,
    `--output "${file}"`,
    '--compact true',
    '--control-flow-flattening true',
    '--control-flow-flattening-threshold 0.3',
    '--dead-code-injection true',
    '--dead-code-injection-threshold 0.1',
    '--string-array true',
    '--string-array-encoding base64',
    '--string-array-threshold 0.75',
    '--rename-globals false',
    '--self-defending true',
    '--disable-console-output true'
  ].join(' ');

  try {
    execSync(cmd, { stdio: 'inherit' });
  } catch (e) {
    console.error(`Failed to obfuscate ${file}:`, e.message);
    process.exit(1);
  }
}

console.log('Obfuscation complete.');
