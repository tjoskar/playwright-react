import React from "react";

export function MyButton() {
  const [clicked, setClicked] = React.useState(false);
  return (
    <button onClick={() => setClicked(true)}>
      {clicked ? "You have clicked me" : "Click on me"}
    </button>
  );
}
