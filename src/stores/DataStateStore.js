/**
 * This clears loading state.
 */
export const clearLoading = () => data => ({
  ...data,
  loading: false,
});

/**
 * This clears error state.
 */
export const clearError = () => data => ({
  ...data,
  error: null,
});

/**
 * This sets loading state and clears error state.
 */
export const setLoading = () => data => ({
  ...data,
  loading: true,
  error: null, // no error while loading
});

/**
 * This sets error state and clears loading state.
 */
export const setError = (errorMsg, description = '') => data => ({
  ...data,
  error: {
    message: errorMsg,
    description,
  },
  loading: false,
});

/**
 * DataState store is primarily used to wrap other stores.
 */
const data = otherData => ({
  ...otherData,
  loading: false,
  error: null,
});
export default data;
