function extractError(error: any): string | null {
  const regex = /'([^']+)'/;
  console.log(error);
  const match = error.match(regex);
  return match ? match[1] : null;
}

export default { extractError };
