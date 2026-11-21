"use client";

/** Prints or saves the page as a PDF. Browsers name a saved PDF after the page title, so a receipt can pass a title that
 * carries its reference; the page title is restored as soon as printing ends. */
export function PrintButton({ documentTitle }: { documentTitle?: string }) {
  function print() {
    if (!documentTitle) { window.print(); return; }
    const original = document.title;
    const restore = () => { document.title = original; window.removeEventListener("afterprint", restore); };
    window.addEventListener("afterprint", restore);
    document.title = documentTitle;
    window.print();
  }
  return <button className="button secondary print-button" type="button" onClick={print}>Print or save as PDF</button>;
}
