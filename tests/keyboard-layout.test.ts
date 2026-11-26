import { keyboardLayout } from '../lib/keyboard-layout';

test('resized Android viewport scrolls an occluded field without adding the keyboard height twice', () => {
  expect(
    keyboardLayout({
      keyboardTop: 500,
      viewportBottom: 500,
      fieldBottom: 560,
      scrollOffset: 100,
      clearance: 16,
    }),
  ).toEqual({ bottomInset: 0, scrollTo: 176 });
});
test('overlay keyboard adds the missing scrollable space as well as revealing the field', () => {
  expect(
    keyboardLayout({
      keyboardTop: 500,
      viewportBottom: 800,
      fieldBottom: 740,
      scrollOffset: 100,
      clearance: 16,
    }),
  ).toEqual({ bottomInset: 300, scrollTo: 356 });
});
test('already visible fields preserve the current scroll position', () => {
  expect(
    keyboardLayout({
      keyboardTop: 500,
      viewportBottom: 500,
      fieldBottom: 400,
      scrollOffset: 100,
      clearance: 16,
    }),
  ).toEqual({ bottomInset: 0, scrollTo: 100 });
});
test('uses the smaller viewport when it ends above the keyboard', () => {
  expect(
    keyboardLayout({
      keyboardTop: 500,
      viewportBottom: 450,
      fieldBottom: 440,
      scrollOffset: 0,
      clearance: 16,
    }),
  ).toEqual({ bottomInset: 0, scrollTo: 6 });
});
