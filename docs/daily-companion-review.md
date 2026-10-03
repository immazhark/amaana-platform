# Daily companion finish review

## Disposition

Ship the scoped companion preview, with the explicitly labelled calendar estimate. No material blocking defect found in commit `8afcf2d6b1d61d52ee26f2c048f5b2117dea7163`. This is not approval of the paused website rebuild or confirmation of Hyderabad moonsighting.

## Material findings with evidence

The former header overlap is resolved: the latest desktop capture shows the complete reading heading and close control above the site header. Both panels have legible content, a clear hierarchy, reachable scrolling content and visible source links. Escape restores the respective trigger; the close button works; switching triggers retains only one panel. No blocking layout or content loss was found at 1440×960, 390×844 or 320×844.

One nonblocking P3 fit issue remains: at 390px with a 15px browser scrollbar, the mobile panel measures x=-3px and width=366px. `100vw` includes the scrollbar, causing the left border to clip. Text and controls remain readable at both mobile sizes. Use `width: calc(100% - 24px)` in the mobile rule to preserve the intended gutter.

## Contract and request coverage

Separate labelled Ayah/Hadith and Salah/Hijri controls are present, with one nonmodal panel at a time. Arabic, attributed translation, hadith meaning-summary labels and Quran.com/Sunnah source destinations are present. A natural midnight transition was observed from September 13's 2:153 reading to September 14's 55:60 reading.

Hyderabad prayer data loaded successfully on the final build for September 14: Fajr 04:51, sunrise 06:04, Dhuhr 12:12, Hanafi Asr 16:36, Maghrib 18:19 and Isha 19:32. Selecting Standard Asr changed Asr to 15:34. The estimate and local-masjid qualifications are visible; source details explain the provider and calendar. Empty announcement data correctly avoids claiming local confirmation.

The schedule includes Monday/Thursday fasting, Friday Kahf/durood, nightly Baqarah final verses/Mulk, morning/evening adhkar and general dhikr. Next changes the prompt; Auto-play starts opted out and toggles to Pause and back. The source implements focus/hover/reduced-motion guards and conservative fasting-date suppression.

## Evidence and limitations

Independent source review covered the request/direction contract, component, stylesheet, daily library, API route, moon data and PRODUCT.md against the supplied craft floor. Live browser screenshots and accessibility trees were inspected directly; the browser screenshot API did not save files, so no screenshot paths or archived raster evidence are claimed. This is an explicit adaptation to available tooling.

Desktop final-build identity was confirmed by Auto-play and the corrected stacking. Mobile checks continued on that loaded build across midnight. The earlier deployment was briefly inspected while the final deployment completed; its known header defect is excluded from the final verdict. The primary agent separately reported successful CI and route tests; these were not rerun by this reviewer. Browser failure injection, clipboard actions, device notifications, religious-source reauthentication and real local moon-announcement validation were not performed. Source destinations were inspected, not independently opened. Reduced-motion behavior was source-reviewed, not emulated. The temporary review tab was closed and the viewport override reset.

## Required fixes and verification

No blocking implementation fix is required for the labelled-estimate preview. Correct and spot-check the small mobile gutter issue when integrating this report. A verified Hyderabad authority announcement remains necessary before describing the calendar as locally confirmed. Retain that unresolved status in the handoff; do not manufacture an announcement or extrapolate a confirmed month. No broader redesign is requested by this review.
