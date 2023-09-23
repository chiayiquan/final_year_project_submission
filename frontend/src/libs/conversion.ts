function convertToUAvax(value: number): number {
  return value * 1000000;
}

function convertFromUAvax(value: number): number {
  return value / 1000000;
}

export default { convertToUAvax, convertFromUAvax };
