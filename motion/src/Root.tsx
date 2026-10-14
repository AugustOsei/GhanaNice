import React from 'react';
import { Composition } from 'remotion';
import { Film, FILM_LENGTH } from './Film';
import { FPS, H, W } from './brand';

export const Root: React.FC = () => (
  <Composition id="GhanaNice" component={Film} durationInFrames={FILM_LENGTH} fps={FPS} width={W} height={H} />
);
