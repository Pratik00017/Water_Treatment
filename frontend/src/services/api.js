import axios from 'axios';

/* =========================================================
   API BASE URL
   ========================================================= */

const API_URL =
  process.env.REACT_APP_API_URL || '/api';

/* =========================================================
   GET LOGGED-IN USER
   ========================================================= */

const getStoredUser = () => {
  try {
    const storedUser =
      localStorage.getItem('aquaxai-user');

    if (!storedUser) {
      return null;
    }

    return JSON.parse(storedUser);
  } catch (error) {
    console.error(
      'Unable to read aquaxai-user:',
      error
    );

    return null;
  }
};

/* =========================================================
   GET LOGGED-IN USER ID
   Supports all possible login storage formats
   ========================================================= */

const getUserId = () => {
  const user = getStoredUser();

  if (!user) {
    return null;
  }

  const userId =
    user?.id ??
    user?.user_id ??
    user?.user?.id ??
    user?.user?.user_id ??
    null;

  if (
    userId === null ||
    userId === undefined ||
    userId === ''
  ) {
    return null;
  }

  return String(userId);
};

/* =========================================================
   AXIOS INSTANCE
   ========================================================= */

export const api = axios.create({
  baseURL: API_URL,
  timeout: 60000,

  headers: {
    'Content-Type': 'application/json',
  },
});

/* =========================================================
   REQUEST INTERCEPTOR
   Sends X-User-ID on every backend request
   ========================================================= */

api.interceptors.request.use(
  (config) => {
    const userId = getUserId();

    if (!config.headers) {
      config.headers = {};
    }

    if (userId) {
      config.headers['X-User-ID'] = userId;
    }

    /*
     * Useful while testing login/history.
     */
    console.log(
      '[AquaXAI API]',
      config.method?.toUpperCase(),
      config.url,
      'X-User-ID:',
      userId || 'MISSING'
    );

    return config;
  },

  (error) => {
    return Promise.reject(error);
  }
);

/* =========================================================
   RESPONSE ERROR HANDLER
   ========================================================= */

api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response) {
      const status =
        error.response.status;

      const detail =
        error.response.data?.detail;

      let detailMessage = '';

      if (Array.isArray(detail)) {
        detailMessage = detail
          .map((item) => {
            if (
              typeof item === 'string'
            ) {
              return item;
            }

            if (
              item?.msg &&
              Array.isArray(item?.loc)
            ) {
              return (
                `${item.loc.join(' → ')}: ` +
                `${item.msg}`
              );
            }

            return (
              item?.msg ||
              item?.message ||
              'Invalid request.'
            );
          })
          .join(' | ');
      } else if (
        typeof detail === 'string'
      ) {
        detailMessage = detail;
      }

      let message;

      switch (status) {
        case 400:
          message =
            detailMessage ||
            'Invalid request.';
          break;

        case 401:
          message =
            detailMessage ||
            'Invalid email or password.';
          break;

        case 403:
          message =
            detailMessage ||
            'You do not have permission to perform this action.';
          break;

        case 404:
          message =
            detailMessage ||
            'The requested service is not available.';
          break;

        case 409:
          message =
            detailMessage ||
            'This account already exists.';
          break;

        case 422:
          message =
            detailMessage ||
            'Some input values are invalid.';
          break;

        default:
          if (status >= 500) {
            message =
              detailMessage ||
              'The server could not complete the request.';
          } else {
            message =
              detailMessage ||
              'The request could not be completed.';
          }
      }

      error.userMessage = message;
    }

    else if (
      error.code === 'ECONNABORTED'
    ) {
      error.userMessage =
        'The request timed out. Please try again.';
    }

    else {
      error.userMessage =
        'Unable to connect to the AquaXAI backend.';
    }

    return Promise.reject(error);
  }
);

/* =========================================================
   WATER ANALYSIS
   ========================================================= */

export const analyzeWater = (
  payload
) => {
  return api.post(
    '/analyze-water',
    payload
  );
};

/* =========================================================
   LOGIN
   ========================================================= */

export const loginUser = (
  payload
) => {
  return api.post(
    '/login',
    payload
  );
};

/* =========================================================
   SIGNUP
   ========================================================= */

export const signupUser = (
  payload
) => {
  return api.post(
    '/signup',
    payload
  );
};

/* =========================================================
   AQUA ASSISTANT
   ========================================================= */

export const chatWithAssistant = (
  payload
) => {
  const question =
    typeof payload === 'string'
      ? payload
      : payload?.question ||
        payload?.message ||
        '';

  return api.post(
    '/chat',
    {
      question,
    }
  );
};

/* =========================================================
   ANALYSIS HISTORY
   ========================================================= */

export const getAnalysisHistory = () => {
  return api.get('/history');
};

/* =========================================================
   OPTIONAL ENDPOINT
   ========================================================= */

export const callOptionalEndpoint = async (
  envKey,
  fallbackPath,
  payload
) => {
  const endpoint =
    process.env[envKey] ||
    fallbackPath;

  return api.post(
    endpoint,
    payload
  );
};

/* =========================================================
   EXPORT API URL
   ========================================================= */

export {
  API_URL,
  getUserId,
};