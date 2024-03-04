export const roundNumber = (numberToRound: number, digits = 0) => {
  return +numberToRound.toFixed(digits);
};
