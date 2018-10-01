/**
 * Basic utility to wait for things in async functions, for testing only.
 *
 * @param {number} [ms]
 * @returns {Promise<void>}
 */
export default function sleep(ms?: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}
