import React from "react";

interface Props {
  text: string;
}

export function MyText({ text }: Props) {
  return <p>My text is: {text}</p>;
}
