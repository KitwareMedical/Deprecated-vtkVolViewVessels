export function setLoading(stores, state) {
  stores.image.loading = state;
}

// TODO use filename
export function loadImage(stores, filename) {
  setLoading(stores, true);
  stores.api.loadImage()
    .then((imageData) => {
      setLoading(stores, false);
      stores.image.data = imageData;
    })
    .catch((err) => {
      // TODO move this to a console logging component
      // console.error(err);
      stores.image.error = err;
    });
}

export function setSlice(stores, slice) {
  stores.image.slicePosition = slice;
}
