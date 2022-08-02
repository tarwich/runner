export const stopPropagation =
  <T extends { stopPropagation(): void }, U = void>(callback: (e: T) => U) =>
  (e: T) => {
    e.stopPropagation();

    return callback(e);
  };
