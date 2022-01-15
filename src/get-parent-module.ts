import { dirname } from 'path';

export function parentModule() {
        const stacks = [...new Set(callsites().map(s => s.getFileName()))];
  const filename = stacks[2];
  if (!filename) {
    throw new Error('Could not get filename of the test');
  }
  return dirname(filename);
}

function callsites(): NodeJS.CallSite[] {
	const _prepareStackTrace = Error.prepareStackTrace;
	Error.prepareStackTrace = (_, stack) => stack;
	const stack = new Error().stack!.slice(1);
	Error.prepareStackTrace = _prepareStackTrace;
	return stack as unknown as NodeJS.CallSite[];
}