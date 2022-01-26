import React from "react";
export function Wrapper({ children }: { children: JSX.Element }) {
  return (
    <div>
      <div style={{ backgroundColor: "green" }}>{children}</div>
      <div style={{ backgroundColor: "blue" }}>{children}</div>
    </div>
  );
}
