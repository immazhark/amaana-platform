"use client";

/** Downloads the ordinary acknowledgement as a PDF. The private credential is posted in a request body, never put in a
 * URL, and it exists in the page only for the instant the form is submitted: the form is built on click, sent to a new
 * tab so a failed attempt can never replace the receipt, and removed straight away. */
export function AcknowledgementPdfButton({ reference, getToken }: { reference: string; getToken: () => string | null }) {
  function download() {
    const token = getToken();
    if (!token) return;
    const form = document.createElement("form");
    form.method = "post";
    form.action = "/api/donations/acknowledgement/pdf";
    form.target = "_blank";
    form.rel = "noopener";
    form.hidden = true;
    for (const [name, value] of [["reference", reference], ["token", token]] as const) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = value;
      form.append(input);
    }
    document.body.append(form);
    form.submit();
    form.remove();
  }
  return <button className="button secondary print-button" type="button" onClick={download}>Download PDF</button>;
}
