/**
 * Process items in concurrent batches to avoid overwhelming the database.
 * Returns results for each item (success or error).
 */
export async function batchProcess<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  concurrency = 10
): Promise<Array<{ item: T; result?: R; error?: unknown }>> {
  const results: Array<{ item: T; result?: R; error?: unknown }> = []

  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency)
    const settled = await Promise.allSettled(batch.map(fn))

    for (let j = 0; j < settled.length; j++) {
      const outcome = settled[j]!
      if (outcome.status === 'fulfilled') {
        results.push({ item: batch[j]!, result: outcome.value })
      } else {
        results.push({ item: batch[j]!, error: outcome.reason })
      }
    }
  }

  return results
}
