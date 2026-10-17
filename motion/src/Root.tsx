import React from 'react';
import { Composition } from 'remotion';
import { Film, FILM_LENGTH } from './Film';
import { FestivalsFilm, FestivalsVertical, FESTIVALS_LENGTH } from './festivals/FestivalsFilm';
import { FPS, H, W } from './brand';

export const Root: React.FC = () => (
  <>
    <Composition id="GhanaNice" component={Film} durationInFrames={FILM_LENGTH} fps={FPS} width={W} height={H} />
    <Composition id="Festivals" component={FestivalsFilm} durationInFrames={FESTIVALS_LENGTH} fps={FPS} width={W} height={H} />
    <Composition id="FestivalsVertical" component={FestivalsVertical} durationInFrames={FESTIVALS_LENGTH} fps={FPS} width={W} height={1920} />
  </>
);
