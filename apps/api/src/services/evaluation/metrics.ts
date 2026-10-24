
export interface EvaluationMetrics {
  recallAt5: number;
  reciprocalRank: number;
}

export function calculateRetrievalMetrics(
  retrievedChunkIds: string[],
  relevantChunkIds: string[],
  k = 5
): EvaluationMetrics {
  const relevant = new Set(relevantChunkIds);

  if (relevant.size === 0) {
    throw new Error(
      "Cannot calculate retrieval metrics without relevant chunk IDs."
    );
  }

  const topK = retrievedChunkIds.slice(0, k);
  const hits = topK.filter((id) => relevant.has(id)).length;

  const firstRelevantRank = topK.findIndex(
    (id) => relevant.has(id)
  );

  return {
    recallAt5: hits / relevant.size,
    reciprocalRank:
      firstRelevantRank === -1 ? 0 : 1 / (firstRelevantRank + 1)
  };
}

export function calculateExpectedFactCoverage(
  answer: string,
  expectedFacts: string[]
): number | null {
  if (expectedFacts.length === 0) return null;

  const normalizedAnswer = answer
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

  const covered = expectedFacts.filter((fact) => {
    const normalizedFact = fact
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

    return normalizedFact.length > 0 &&
      normalizedAnswer.includes(normalizedFact);
  }).length;

  return covered / expectedFacts.length;
}
