import React from "react";
import { MyText } from "../MyText";

export const tests = [
  {
    name: "My text: Stannis",
    render(): JSX.Element {
      return <MyText text="Stannis" />;
    },
  },
  {
    name: "My text: Pannis",
    render(): JSX.Element {
      return <MyText text="Pannis" />;
    },
  },
];
