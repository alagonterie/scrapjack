/**
 * Starts an async delay in milliseconds.
 * @param {number} ms Millisecond count for delay.
 */
export function delayAsync(ms: number): Promise<unknown> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
