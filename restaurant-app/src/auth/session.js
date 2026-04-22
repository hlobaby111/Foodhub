let accessToken = null;
let currentUser = null;
let unauthorizedHandler = null;

export const getAccessToken = () => accessToken;
export const setAccessToken = (token) => {
  accessToken = token || null;
};

export const getCurrentUser = () => currentUser;
export const setCurrentUser = (user) => {
  currentUser = user || null;
};

export const setUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler;
};

export const notifyUnauthorized = () => {
  if (typeof unauthorizedHandler === 'function') {
    unauthorizedHandler();
  }
};
