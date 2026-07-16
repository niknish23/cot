let pendingDeletedToast = false;

export function markThoughtDeletedToast() {
  pendingDeletedToast = true;
}

export function consumeThoughtDeletedToast() {
  if (!pendingDeletedToast) {
    return false;
  }

  pendingDeletedToast = false;
  return true;
}
