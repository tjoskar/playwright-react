import React from "react";
import { MyComponent } from "../MyComponent";
import type { TestArgs } from '../../src/index';

export const Stannis = () => <MyComponent name="Stannis" />;

export const attachClickListener = ({ spy }: TestArgs) => {
  const onClick = spy('click');

  return () => <MyComponent name="Dexter" onClick={onClick} />;
};
