import React from 'react';
import { Story } from "@kivra/toybox";
import { MyText } from "./MyText";

export const story: Story = {
  header: {
    description: "My text",
  },
  stories: [
    {
      render() {
        return <MyText text="Stannis" />;
      },
    },
  ],
};
