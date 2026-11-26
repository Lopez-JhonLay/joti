export function keyboardLayout({
  keyboardTop,
  viewportBottom,
  fieldBottom,
  scrollOffset,
  clearance,
}: {
  keyboardTop: number;
  viewportBottom: number;
  fieldBottom: number;
  scrollOffset: number;
  clearance: number;
}) {
  return {
    bottomInset: Math.max(0, viewportBottom - keyboardTop),
    scrollTo: Math.max(
      0,
      scrollOffset +
        Math.max(
          0,
          fieldBottom + clearance - Math.min(keyboardTop, viewportBottom),
        ),
    ),
  };
}
