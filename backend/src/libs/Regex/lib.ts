function checkValidEmail(email: string): boolean {
  const regexp = new RegExp("\\S+@\\S+\\.\\S+");
  return email.length > 0 && email.length < 255 && regexp.test(email);
}

export default { checkValidEmail };
