import { effect, type Signal } from "@preact/signals-core";

type DefinitelyDefined<T> = Exclude<T, undefined>;
type SignalValue<S> = S extends Signal<infer T> ? T : never;
type MapSignalsToDefinedValues<T extends ReadonlyArray<Signal<unknown>>> = {
  [K in keyof T]: DefinitelyDefined<SignalValue<T[K]>>;
};
type DefinedEffectCallback<T extends ReadonlyArray<Signal<unknown>>> = (
  ...args: MapSignalsToDefinedValues<T>
) => void | (() => void);

/**
 * Creates an effect using @preact/signals-core that runs a callback
 * only when all specified signals have values that are not `undefined`.
 * The callback receives the signal values as arguments, typed as non-undefined.
 *
 * @param callback The function to execute when all signals are defined.
 * @param signals An array of signals to track ([signalA, signalB, ...]).
 * It receives the defined signal values as arguments.
 * @returns A dispose function to stop the effect.
 * @example
 * ```typescript
 * import { signal } from "@preact/signals-core";
 * import { effectWhenDefined } from "./effectWhenDefined"; // Adjust import path
 *
 * // Setup signals (potentially undefined initially)
 * const firstName = signal<string | undefined>(undefined);
 * const lastName = signal<string | undefined>(undefined);
 * const age = signal<number | undefined>(undefined);
 *
 * // Set up the effect
 * console.log("Setting up effectWhenDefined...");
 * const dispose = effectWhenDefined(
 * // Callback receives defined values: fName: string, lName: string, userAge: number
 * (fName, lName, userAge) => {
 * console.log("EFFECT RUNNING: All signals defined!");
 * const info = `${fName} ${lName} is ${userAge}.`;
 * console.log(info);
 * // document.getElementById('output')!.innerText = info; // Example side effect
 *
 * // Example cleanup
 * return () => {
 * console.log(`CLEANUP for ${fName} ${lName} (${userAge})`);
 * // document.getElementById('output')!.innerText = 'Waiting for data...';
 * };
 * },
 * [firstName, lastName, age]
 * );
 *
 * // Simulate signal updates
 * console.log("Updating signals...");
 * setTimeout(() => { console.log("Setting firstName"); firstName.value = "Jane"; }, 500);
 * setTimeout(() => { console.log("Setting lastName"); lastName.value = "Doe"; }, 1000);
 * // Effect still hasn't run
 * setTimeout(() => {
 * console.log("Setting age - effect should run now.");
 * age.value = 28;
 * }, 1500);
 * // Effect runs: "Jane Doe is 28."
 *
 * setTimeout(() => {
 * console.log("Setting age to undefined - cleanup should run.");
 * age.value = undefined; // Cleanup for "Jane Doe (28)" runs.
 * }, 2000);
 * // Effect stops running
 *
 * // To stop the effect manually later:
 * // dispose();
 * ```
 */
export function definedEffect<T extends ReadonlyArray<Signal<unknown>>>(
  callback: DefinedEffectCallback<T>,
  signals: [...T],
): () => void {
  let currentCleanup: (() => void) | void | undefined;
  const dispose = effect(() => {
    const values = signals.map((s) => s.value);

    if (typeof currentCleanup === "function") {
      currentCleanup();
      currentCleanup = undefined;
    }

    if (values.some((v) => v === undefined)) {
      return;
    }

    const definedValues = values as MapSignalsToDefinedValues<T>;
    currentCleanup = callback(...definedValues);
  });

  return () => {
    if (typeof currentCleanup === "function") {
      currentCleanup();
    }
    dispose();
  };
}
