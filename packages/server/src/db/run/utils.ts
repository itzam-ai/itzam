import Decimal from "decimal.js";

export function calculateRunCost(
  inputPerMillionTokenCost: string,
  outputPerMillionTokenCost: string,
  inputTokens: number,
  outputTokens: number
) {
  const inputTokenCostPerToken = Decimal(Number(inputPerMillionTokenCost)).div(
    1_000_000
  );

  const outputTokenCostPerToken = Decimal(
    Number(outputPerMillionTokenCost)
  ).div(1_000_000);

  const runCost = inputTokenCostPerToken
    .mul(inputTokens)
    .add(outputTokenCostPerToken.mul(outputTokens));

  return runCost;
}

export function calculateInputCost(
  inputPerMillionTokenCost: string,
  inputTokens: number
) {
  const inputTokenCostPerToken = Decimal(Number(inputPerMillionTokenCost)).div(
    1_000_000
  );

  const inputCost = inputTokenCostPerToken.mul(inputTokens);

  return inputCost;
}

export function calculateOutputCost(
  outputPerMillionTokenCost: string,
  outputTokens: number
) {
  const outputTokenCostPerToken = Decimal(
    Number(outputPerMillionTokenCost)
  ).div(1_000_000);

  const outputCost = outputTokenCostPerToken.mul(outputTokens);

  return outputCost;
}
