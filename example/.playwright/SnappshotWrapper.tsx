import { Wrapper } from "./Wrapper";
import { mountAndTakeSnapshot } from '@kivra/playwright-react/client';

mountAndTakeSnapshot(Test => <Wrapper><Test /></Wrapper>);
