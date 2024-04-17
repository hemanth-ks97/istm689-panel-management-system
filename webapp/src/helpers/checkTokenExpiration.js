export const isTokenExpired = (user) => {
  const now = Date.now();
  const expiration = user.expiration * 1000;

  if (now > expiration) {
    return true;
  }
  return false;
};
