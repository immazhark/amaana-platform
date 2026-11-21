import { Icon } from "./donation-interface-icons";

/** Decorative share icons; the containing control supplies the name. */
type IconProps = { className?: string };
export const ShareIcon = (p: IconProps) => <Icon {...p}><path d="M12 16V3m0 0 4.5 4.5M12 3 7.5 7.5M5 13v5a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-5"/></Icon>;
export const MessageIcon = (p: IconProps) => <Icon {...p}><path d="M20 11.5a8 8 0 0 1-8 8H7l-4 2v-6a8 8 0 1 1 17-4Z"/><path d="m8.7 9.5 2 2 3.8-3.8"/></Icon>;
