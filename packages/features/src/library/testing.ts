import { setLibrary } from "./current";
import { TEST_LIBRARY } from "./testLibrary";

export { TEST_LIBRARY };

/** Gives tests the seeded library, as the provider does once it loads. */
export const loadTestLibrary = (): void => setLibrary(TEST_LIBRARY);
