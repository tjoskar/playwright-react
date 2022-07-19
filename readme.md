# See this fork instead: https://github.com/kivra/playwright-react

## Playwright React

This library makes it possible to unit test react components in a real browser with [Playwright](https://playwright.dev/).

Inspired by [@cypress/react](https://www.npmjs.com/package/@cypress/react).

This is a proof of concept and is probably quite instable. I do not recommend anyone to use it at this stage.

## Install

```
npm install -D @playwright/test tjoskar/playwright-react
```

## Usage

This is a proof of concept and in a exploratory stage.

There is currently four ways of using this lib.

Let's say you want to test this component:

```tsx
// MyComponent.tsx
interface Props {
  name: string;
}

export function MyComponent(props: Props) {
  return <h1>Hello {props.name}</h1>;
}
```

### Option 1: Using `React.mount` inside the test

```ts
// MyComponent.spec.ts
import { expect, test } from '@playwright/test';
import { createElement } from 'react';
import { setup } from '@tjoskar/playwright-react';

// Set up the components you want to test. You can add as many as you want.
const mount = setup({
  MyComponent: () => import('./MyComponent').then(c => c.MyComponent),
});

test('Test MyComponent', async ({ page }) => {
  await mount(page, ({ MyComponent }) => {
    // You will get typescript intellisense here, but it can be better
    return createElement(MyComponent, { name: "John" });
  });

  await expect(page.locator('text=Hello John')).toBeVisible();
});
```

#### 👍
- All setup in the same file
- Can use playwright's api

#### 👎
- Can not use jsx/tsx. See [playwright#7121](https://github.com/microsoft/playwright/issues/7121)
- The code will be compiled by both Playwright (for runing in node) and esbuild (for runing in the browser)
- Closure will not work inside `mount`, ex. you can not access variables outside `mount`. Even if it looks like it.
- `react.createElement` has bad ts types (pops is always optional).

### Option 2 (recomended right now): Import an external component (component under test)

```ts
// __tests__/ComponentUnderTest.tsx
import React from "react";
import { MyComponent } from "../MyComponent";

export const Stannis = () => <MyComponent name="Stannis" />;
```

```ts
// __tests__/MyComponent.spec.ts
import { expect } from "@playwright/test";
import { componentTest } from '@tjoskar/playwright-react';

componentTest("Test MyComponent", async ({ page, mount }) => {
  await mount(() => import('./ComponentUnderTest').then(c => c.Stannis));

  await expect(page.locator('text=Hello! My name is Stannis')).toBeVisible();
});
```

#### 👍
- Easy to understad
- Can use playwright's api

#### 👎
- Need seperate file for complex props (we do not need a seperate file in the example above)

### Option 3: Execute the test in the browser

```tsx
// __tests__/MyComponent.comp-spec.tsx
import React from "react";
import { render, screen } from '@testing-library/react'
import { MyComponent } from "../MyComponent";

export const test = async () => {
  render(<MyComponent name="Stannis" />);

  screen.getByText(/Stannis/i);
}
```

```ts
// __tests__/MyComponent.spec.ts
import { expect } from "@playwright/test";
import { componentTest } from '@tjoskar/playwright-react';

componentTest("Test MyComponent", async ({ execute }) => {
  await execute(() => import('./MyComponent.comp-spec').then(c => c.test));
});
```

#### 👍
- Can use (react) testing library

#### 👎
- Can not use playwright's api
- Need a assert lib (this can be solved)
- Need seperate file (this can be solved)

### Option 4: Pre compile the test

See https://github.com/tjoskar/playwright-react/pull/1 for more information

## Assert click events

```ts
// __tests__/ComponentUnderTest.tsx
import React from "react";
import { MyComponent } from "../MyComponent";

export const attachClickListener = ({ spy }: TestArgs) => {
  const onClick = spy('click');

  return () => <MyComponent name="Dexter" onClick={onClick} />;
};
```

```ts
// __tests__/MyComponent.spec.ts
import { expect } from "@playwright/test";
import { componentTest } from '@tjoskar/playwright-react';

componentTest("Test MyComponent with a spy function", async ({ page, mount }) => {
  const { events } = await mount((utils) =>
    import("./ComponentUnderTest").then((c) => c.attachClickListener(utils))
  );

  expect(events.callCount('click')).toBe(0);
  await page.locator("text=Hello! My name is Dexter").click();
  expect(events.callCount('click')).toBe(1);
  expect(events.args('click')[0][0]).toBe('Dexter');
});
```

## Image snapshot

Create a component you want to take a snapshot of:
```tsx
// src/components/__tests__/MyText.snap.tsx
import React from 'react';
import { MyText } from '../MyText';

export const tests = [{
  name: 'My text: Stannis',
  render(): JSX.Element {
    return <MyText text="Stannis" />
  }
}]
```

Create a test that will find all snapshots test and render them, one by one:

```tsx
// src/snapshots.spec.tsx
import { takeSnapshot } from "@kivra/playwright-react";

takeSnapshot();
```

Update your `playwright.config.ts`:
```ts
// playwright.config.ts
import { PlaywrightTestConfig } from '@kivra/playwright-react';

const config: PlaywrightTestConfig = {
  testDir: 'src',
  testMatch: '**/*.spec.ts',
  use: {
    viewport: null,
  },
  react: {
    snapshotFileGlob: './src/**/*.snap.tsx',
    wrapper: {
      path: './.playwright/Wrapper',
      componentName: 'Wrapper'
    }
  }
};
export default config;
```

Create a `Wrapper` component that will wrap every snapshot:
```tsx
// .playwright/Wrapper.tsx
import React from "react";

export function Wrapper({ children }: { children: JSX.Element }) {
  return (
    <div>
      <Theme color="dark">{children}</Theme>
      <Theme color="light">{children}</Theme>
    </div>
  );
}

```


## Development

To test this in example, fisrt pack this lib with `npm run build && npm pack` and then run `npm install` inside `example`. It does not work to install it by `npm install ..` due to linking isuues.
