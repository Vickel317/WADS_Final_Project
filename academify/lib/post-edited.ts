export function wasPostEditedByUser(editedAt?: Date | string | null): boolean {
  return editedAt != null;
}
