/*
 * This is just a sample. It should probably excluded from the final build,
 * but it's a useful reference for now.
 */

import {Command, Options, command, option, param, params} from 'clime';

export class SampleOptions extends Options {
    @option({
        flag: 't',
        description: 'timeout that does nothing',
      })
      timeout: number = 0;
}

@command()
export default class extends Command {
  async execute(
    @param({
      required: true,
      description: 'required parameter foo',
    })
    foo: string,
    @param({
      description: 'optional parameter bar',
    })
    bar: number,
    @params({
      type: String,
      description: 'extra parameters',
    })
    args: string[],
    options: SampleOptions,
  ) {
    return 'Hello, Clime!';
  }
}