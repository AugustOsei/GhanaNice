import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import { C } from './brand';
import { Mosque, MOSQUE_LENGTH } from './scenes/Mosque';
import { Opening, OPENING_LENGTH } from './scenes/Opening';
import { Laptop, LAPTOP_LENGTH } from './scenes/Laptop';
import { Finale, FINALE_LENGTH } from './scenes/Finale';

/* The v2 film: one strand of yarn and one camera move. Writes "nice.", draws the phone, dives
   into the site's spinning window, turns the Larabanga photo into a drawing, pulls back to the
   real page on a laptop, circles three features, and ends on the invitations and the star. */
const PLACES_AT = OPENING_LENGTH;
const PLACES_FOR = MOSQUE_LENGTH;
const LAPTOP_AT = PLACES_AT + PLACES_FOR;
const FINALE_AT = LAPTOP_AT + LAPTOP_LENGTH - 6;
export const FILM_LENGTH = FINALE_AT + FINALE_LENGTH;

export const Film: React.FC = () => (
  <AbsoluteFill style={{ background: C.ink }}>
    <Sequence durationInFrames={OPENING_LENGTH}><Opening /></Sequence>
    <Sequence from={PLACES_AT} durationInFrames={PLACES_FOR}><Mosque /></Sequence>
    {/* The laptop stays underneath until the finale's page has fully risen over it. */}
    <Sequence from={LAPTOP_AT} durationInFrames={LAPTOP_LENGTH + 20}><Laptop /></Sequence>
    <Sequence from={FINALE_AT}><Finale /></Sequence>
  </AbsoluteFill>
);
