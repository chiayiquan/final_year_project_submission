function checkValidEmail(email: string): boolean {
  const regexp = new RegExp("\\S+@\\S+\\.\\S+");
  const trimmedEmail = email.trim();
  return (
    trimmedEmail.length > 0 &&
    trimmedEmail.length < 255 &&
    regexp.test(trimmedEmail)
  );
}

function checkEthAddress(address: string): boolean {
  const ethereumAddressRegex = new RegExp("^0x[a-fA-F0-9]{40}$");
  return ethereumAddressRegex.test(address.trim());
}
export default { checkValidEmail, checkEthAddress };
