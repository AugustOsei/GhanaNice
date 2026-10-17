import { Config } from '@remotion/cli/config';

/* Remotion's own headless Chrome crashes in a path with a space ("Ghana Nice"), so render with
   the installed Google Chrome. */
Config.setBrowserExecutable('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');

/* With several tabs rendering at once, the installed Chrome sometimes captures a half-drawn or
   tiled frame (single-frame flickers in the video). One tab is slower but clean. */
Config.setConcurrency(1);
