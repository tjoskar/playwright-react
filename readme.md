## Playwright React

This library makes it possible to unit test react components in a real browser with Playwright.

Inspired by [@cypress/react](https://www.npmjs.com/package/@cypress/react).

This is a proof of concept and is probably quite instable. I do not recommend anyone to use it at this stage.

## Install

```
npm install -D @playwright/test tjoskar/playwright-react
```

## Usage

Component to test:

```tsx
// MyComponent.tsx
interface Props {
  name: string;
}

export function MyComponent(props: Props) {
  return <h1>Hello {props.name}</h1>;
}
```

Test:
```ts
// MyComponent.spec.tsx
import { expect, test } from '@playwright/test';
import { createElement } from 'react';
import { setup } from "@tjoskar/playwright-react";

// Set up the components you want to test. You can add as many as you want.
const mount = setup(__dirname, {
  MyComponent: () => import('./MyComponent').then(c => c.MyComponent),
});

test('Test MyComponent', async ({ page }) => {
  await mount(page, ({ MyComponent }) => {
    // You will get typescript intellisense here
    return createElement(MyComponent, { name: "John" });
  });

  await expect(page.locator('text=Hello John')).toBeVisible();
});
```

And then run it as a normal playwright test `npx playwright test`.

### Limitation

– Playwright can only resolve `js` and `ts` files which means that you can't use any jsx/tsx in your test file.
