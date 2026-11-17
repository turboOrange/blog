import React from 'react';
import styles from './LensLayer.module.css';

/* Live "liquid glass" refraction rim — the border distortion of what is
   behind the pane. Four thin backdrop-filter bands hugging the pane
   border, mounted as a flat sibling UNDER the 3-D slab (outside the
   preserve-3d subtree). Because they sample the page backdrop live, the
   frost re-filters every frame: twinkling stars, passing ghosts and page
   scroll all warp through the rim in real time — refraction, not a baked
   snapshot. The flip edge-drag sets data-lens='hidden' on the wrapper to
   fade the rim out while the slab rotates (see Terminal.tsx). */
export default function LensLayer(): React.ReactNode {
  return (
    <div className={styles.lensRim} aria-hidden="true">
      <div className={`${styles.band} ${styles.bandTop}`} />
      <div className={`${styles.band} ${styles.bandBottom}`} />
      <div className={`${styles.band} ${styles.bandLeft}`} />
      <div className={`${styles.band} ${styles.bandRight}`} />
    </div>
  );
}
