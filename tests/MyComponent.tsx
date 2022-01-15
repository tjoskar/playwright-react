import React from 'react';

interface Props {
  name: string;
  onClick?: (name: string) => void;
}

export const MyComponent = ({ name, onClick }: Props) => <h1 onClick={() => onClick?.(name)}>Hello! My name is {name}</h1>;