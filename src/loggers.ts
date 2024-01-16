import { makeGroupLogger, makeLogger } from "./engine/utils/browserFunctions";

export const LOGS_TO_SUPRESS: string[] = [];

const SUPRESSED = (..._silenced: any[]): void => {};

// Delete these logs and make your own. To supress a log, assign it to the SUPRESSED function.

// Alvaro's good ol fancylogs
export const fancyLog = makeLogger("🌟", "#5832ff");
export const fancyGroupLog = makeGroupLogger("✨", "#5832ff");

// Example of a silenced log
export const silencedLog = SUPRESSED; // makeLogger("🤐");
