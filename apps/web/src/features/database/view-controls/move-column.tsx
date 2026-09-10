export function moveColumn(order: string[], id: string, target: string) {
  const next = order.filter((value) => value !== id);
  next.splice(order.indexOf(target), 0, id);
  return next;
}
