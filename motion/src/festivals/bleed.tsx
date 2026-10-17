import React, { createContext, useContext } from 'react';

/* The clip is laid out on a 1080×1350 stage. For 9:16 the stage sits inside the area Reels and
   TikTok leave clear (their buttons and caption cover roughly the top 200px and bottom 370px),
   and each scene's background bleeds past it to the edges: `above` and `below` are how far. */
export type Bleed = { above: number; below: number };
export const BleedContext = createContext<Bleed>({ above: 0, below: 0 });
export const useBleed = () => useContext(BleedContext);

/* A scene background that covers the stage and the bleed. */
export const Backdrop: React.FC<{ background: string }> = ({ background }) => {
  const { above, below } = useBleed();
  return <div style={{ position: 'absolute', left: 0, right: 0, top: -above, bottom: -below, background }} />;
};
