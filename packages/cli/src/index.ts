import 'dotenv/config';

import { Command } from 'commander';

import pkg from '../package.json';
import accountInfo from './commands/account-info';
import programDeploy from './commands/program-deploy';

const cli = new Command();

cli.version(pkg.version);

cli.command('info <accountAddress>').action(async accountAddress => {
  await accountInfo(accountAddress);
});

cli
  .command('deploy <programPath> <programSize> [network]')
  .description('deploy the given .so program on the given network', {
    programPath: 'full path of the so file',
    programSize: 'size of the program (for create a rent free account',
    network: 'solana network (default to devnet)'
  })
  .action(async (programPath, programSize, network) => {
    if (Number.isNaN(+programSize)) {
      console.error('Program Size is not a valid number %o', programSize);
      return;
    }
    await programDeploy(programPath, programSize, network);
  });

cli.parse(process.argv);
