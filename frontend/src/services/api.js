import axios from 'axios';

/* =========================================================
   API BASE URL
   ========================================================= */

const API_URL =
  process.env.REACT_APP_API_URL || '/api';

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
   ERROR HANDLER
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

      /* -----------------------------------------
         FASTAPI VALIDATION ERROR
         ----------------------------------------- */

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
      }

      /* -----------------------------------------
         NORMAL STRING ERROR
         ----------------------------------------- */

      else if (
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

      error.userMessage =
        message;
    }

    /* -----------------------------------------
       TIMEOUT
       ----------------------------------------- */

    else if (
      error.code === 'ECONNABORTED'
    ) {
      error.userMessage =
        'The request timed out. Please try again.';
    }

    /* -----------------------------------------
       NETWORK ERROR
       ----------------------------------------- */

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
   IMPORTANT:
   Backend expects "question", not "message".
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

export const getAnalysisHistory =
  () => {
    return api.get(
      '/history'
    );
  };

/* =========================================================
   OPTIONAL ENDPOINT
   ========================================================= */

export const callOptionalEndpoint =
  async (
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

export { API_URL };