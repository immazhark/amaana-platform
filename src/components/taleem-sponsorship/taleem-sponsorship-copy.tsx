import styles from "@/components/fund-giving/fund-giving.module.css";

// The fine print of the programme sponsorship. Server-rendered and passed to the configurator as slots, so the words are
// not part of the client chunk (the JS budget is enforced). The section, the browser fixture and the tests all use these.
export const taleemIntro = <p className={styles.fine}>Your gift supports the Taleem programme and its teaching. It does not name or reserve a student. The period you choose is paid once; it is not a monthly subscription.</p>;
export const taleemPanelNote = <p className={styles.fine}>Months are a prepaid period, not a recurring mandate. If the programme cannot go ahead as planned, your gift goes to the nearest similar Taleem purpose and is recorded in our ledger. Zakat is never moved to a different purpose without your permission.</p>;
