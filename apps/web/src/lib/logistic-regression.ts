/**
 * Pure-JS logistic regression trainer.
 *
 * Why pure JS: per-user models train on small datasets (30-500 examples)
 * that fit in memory. There's no value in adding a numpy/Tensorflow.js
 * dependency for 100 lines of gradient descent. Zero deps means the
 * trainer runs identically in the nightly cron, in Edge runtime, and
 * in unit tests.
 *
 * Implementation notes:
 *   - Sigmoid activation + binary cross-entropy loss
 *   - L2 regularization (default lambda=0.01) to prevent overfitting
 *     on small per-user datasets — without it, the model memorizes
 *     30 examples and generalizes nowhere
 *   - Returns precision/recall computed on the training set. These
 *     are optimistic estimates; the cron stores them as a sanity
 *     check, not as a held-out validation score
 *   - Numerically stable: clamps sigmoid input to [-500, 500] before
 *     Math.exp to avoid NaN on extreme weights early in training
 */

export interface TrainOptions {
  iterations?: number
  learningRate?: number
  l2Lambda?: number
}

export interface TrainResult {
  coefficients: number[]
  intercept: number
  accuracy: number
  precision: number
  recall: number
}

const DEFAULT_ITERATIONS = 500
const DEFAULT_LEARNING_RATE = 0.05
const DEFAULT_L2_LAMBDA = 0.01

function sigmoid(z: number): number {
  // Clamp to keep Math.exp from overflowing on early-iteration extremes
  const clamped = z > 500 ? 500 : z < -500 ? -500 : z
  return 1 / (1 + Math.exp(-clamped))
}

/**
 * Train a logistic regression model via batch gradient descent with L2
 * regularization.
 *
 * @param X feature matrix (N rows x D columns)
 * @param y binary labels (N values, 0 or 1)
 * @param opts iterations, learningRate, l2Lambda overrides
 * @returns coefficients, intercept, and training-set precision/recall
 */
export function trainLogisticRegression(
  X: number[][],
  y: number[],
  opts: TrainOptions = {},
): TrainResult {
  const iterations = opts.iterations ?? DEFAULT_ITERATIONS
  const learningRate = opts.learningRate ?? DEFAULT_LEARNING_RATE
  const l2Lambda = opts.l2Lambda ?? DEFAULT_L2_LAMBDA

  const n = X.length
  if (n === 0) {
    return { coefficients: [], intercept: 0, accuracy: 0, precision: 0, recall: 0 }
  }
  const d = X[0]!.length

  // Initialize coefficients at zero — symmetric init is fine for
  // logistic regression because the loss surface is convex
  const coefficients = new Array<number>(d).fill(0)
  let intercept = 0

  for (let iter = 0; iter < iterations; iter++) {
    // Compute predictions and accumulate gradients in one pass
    const gradCoef = new Array<number>(d).fill(0)
    let gradIntercept = 0

    for (let i = 0; i < n; i++) {
      const row = X[i]!
      let z = intercept
      for (let j = 0; j < d; j++) z += coefficients[j]! * row[j]!
      const pred = sigmoid(z)
      const error = pred - y[i]!

      gradIntercept += error
      for (let j = 0; j < d; j++) {
        gradCoef[j]! += error * row[j]!
      }
    }

    // Apply gradient step with L2 regularization on coefficients only
    // (NOT on intercept — regularizing the intercept biases predictions
    // toward 0.5 regardless of class balance)
    intercept -= learningRate * (gradIntercept / n)
    for (let j = 0; j < d; j++) {
      const reg = l2Lambda * coefficients[j]!
      coefficients[j]! -= learningRate * (gradCoef[j]! / n + reg)
    }
  }

  // Compute training-set classification metrics at 0.5 threshold
  let truePositive = 0
  let falsePositive = 0
  let falseNegative = 0
  let correct = 0
  for (let i = 0; i < n; i++) {
    const row = X[i]!
    let z = intercept
    for (let j = 0; j < d; j++) z += coefficients[j]! * row[j]!
    const predLabel = sigmoid(z) >= 0.5 ? 1 : 0
    const actual = y[i]!
    if (predLabel === actual) correct++
    if (predLabel === 1 && actual === 1) truePositive++
    else if (predLabel === 1 && actual === 0) falsePositive++
    else if (predLabel === 0 && actual === 1) falseNegative++
  }

  const accuracy = n > 0 ? correct / n : 0
  const precision =
    truePositive + falsePositive > 0
      ? truePositive / (truePositive + falsePositive)
      : 0
  const recall =
    truePositive + falseNegative > 0
      ? truePositive / (truePositive + falseNegative)
      : 0

  return { coefficients, intercept, accuracy, precision, recall }
}

/**
 * Score a single feature vector against trained coefficients. Exported
 * for re-use in prediction-model.ts so we don't duplicate the sigmoid
 * math.
 */
export function predictProbability(
  coefficients: number[],
  intercept: number,
  features: number[],
): number {
  let z = intercept
  const len = Math.min(coefficients.length, features.length)
  for (let j = 0; j < len; j++) z += coefficients[j]! * features[j]!
  return sigmoid(z)
}
