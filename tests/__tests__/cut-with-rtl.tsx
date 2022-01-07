import React from "react";
import { render, screen } from '@testing-library/react'
import { MyComponent } from "../MyComponent";

export const test = async () => {
  render(<MyComponent name="Stannis" />);

  screen.getByText(/Stannis/i);
};
