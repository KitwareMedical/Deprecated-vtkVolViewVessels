export const setLoading = () => data => ({
  ...data,
  loading: true,
});

export const doneLoading = () => data => ({
  ...data,
  loading: false,
});

/**
 * Loading store is primarily used to wrap other stores.
 */
const data = otherData => ({
  ...otherData,
  loading: false,
});
export default data;
