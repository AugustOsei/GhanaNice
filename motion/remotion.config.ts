import { Config } from '@remotion/cli/config';

/* Remotion's own headless Chrome crashes in a path with a space ("Ghana Nice"), so render with
   the installed Google Chrome. */
Config.setBrowserExecutable('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
