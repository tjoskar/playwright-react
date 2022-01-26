import React from 'react';
import { MyText } from '../MyText';

export const tests = [{
  name: 'My text: Stannis',
  render(): JSX.Element {
    return <MyText text="Stannis" />
  }
}]
