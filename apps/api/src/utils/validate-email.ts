export const validateEmail = (email: string) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const isEmailValid = regex.test(email);
  if (!isEmailValid) return false;

  const domain = email.split("@")[1];
  if (!domain) return false;

  return true;
};
