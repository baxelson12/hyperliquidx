import { signal, effect } from "@preact/signals-core";
import type { Signal } from "@preact/signals-core";

/** Represents the state of the fetched resource. */
export interface ResourceState<DataType, ErrorType = Error> {
  /** The successfully fetched data, if any. */
  readonly data?: DataType;
  /** True if the resource is currently being fetched or re-fetched. */
  readonly loading: boolean;
  /** The error object if the last fetch failed. */
  readonly error?: ErrorType;
}

/** The object returned by createResource. */
export interface Resource<DataType, ErrorType = Error> {
  /** A signal containing the current state (data, loading, error) of the resource. */
  readonly state: Signal<ResourceState<DataType, ErrorType>>;
  /** A function to manually trigger a refetch using the latest source value. */
  readonly refetch: () => void;
}

/**
 * Function responsible for fetching the data.
 * @param source The current value from the source function (guaranteed not to be falsy).
 * @param options Contains an AbortSignal for cancellation.
 * @returns A Promise resolving to the fetched data.
 */
export type Fetcher<SourceType, DataType> = (
  source: SourceType,
  options: { signal: AbortSignal },
) => Promise<DataType>;

/**
 * A function returning the source value(s) for the fetcher.
 * If it returns undefined, null, or false, the fetch will not run.
 */
export type SourceFn<SourceType> = () => SourceType | undefined | null | false;

/**
 * Creates a reactive resource that fetches data based on a source signal or function.
 * Manages loading, error, and data states automatically using `@preact/signals-core`.
 * Handles race conditions and provides a manual refetch mechanism.
 *
 * @template SourceType The type of the value provided by the source function.
 * @template DataType The type of the data successfully fetched.
 * @template ErrorType The type of the error object on fetch failure (defaults to Error).
 *
 * @param sourceFn A function that returns the source value(s) for the fetcher.
 * The fetcher runs when this value changes and is truthy.
 * @param fetcher An async function (`(source, { signal }) => Promise<DataType>`)
 * that performs the data fetching. It receives the current source value
 * and an AbortSignal.
 * @returns A Resource object with a `state` signal and a `refetch` function.
 *
 * @example
 * ```ts
 * import { signal, effect } from "@preact/signals-core";
 * import { createResource, Fetcher } from "./createResource"; // Adjust import path
 *
 * // 1. Define a fetcher function
 * interface Post { id: number; title: string; body: string; }
 * const fetchPost: Fetcher<number, Post> = async (postId, { signal }) => {
 * console.log(`Workspaceing post ${postId}...`);
 * await new Promise(res => setTimeout(res, 800)); // Simulate network delay
 * const response = await fetch(`https://jsonplaceholder.typicode.com/posts/${postId}`, { signal });
 * if (!response.ok) throw new Error(`Post ${postId} not found (status: ${response.status})`);
 * if (signal.aborted) throw new Error('Fetch aborted');
 * console.log(`Workspaceed post ${postId}`);
 * return response.json();
 * };
 *
 * // 2. Define the source signal
 * const postId = signal<number | undefined>(undefined);
 *
 * // 3. Create the resource
 * const postResource = createResource(
 * () => postId.value, // Source function reads the signal
 * fetchPost
 * );
 *
 * // 4. React to the resource's state
 * const disposeWatcher = effect(() => {
 * const { data, loading, error } = postResource.state.value;
 * console.log(`Post Resource: Loading=${loading}, Error=${error?.message ?? 'none'}, Data ID=${data?.id}`);
 *
 * // Example: Update UI based on state
 * if (loading) {
 * // document.getElementById('post-view')!.textContent = 'Loading post...';
 * } else if (error) {
 * // document.getElementById('post-view')!.textContent = `Error: ${error.message}`;
 * } else if (data) {
 * // document.getElementById('post-view')!.textContent = `Title: ${data.title}`;
 * } else {
 * // document.getElementById('post-view')!.textContent = 'Select a post ID.';
 * }
 * });
 *
 * // 5. Trigger fetches by changing the source signal
 * console.log("Setting post ID to 1");
 * postId.value = 1; // Starts fetch
 *
 * // 6. Manually refetch after a delay
 * setTimeout(() => {
 * if (postId.value !== undefined) { // Check if source is still valid
 * console.log(`Manually refetching post ${postId.value}`);
 * postResource.refetch();
 * }
 * }, 3000); // Refetch after 3 seconds
 *
 * // 7. Change source signal again
 * setTimeout(() => {
 * console.log("Setting post ID to 5");
 * postId.value = 5; // Fetches post 5
 * }, 5000);
 *
 * // 8. Clear source signal
 * setTimeout(() => {
 * console.log("Clearing post ID");
 * postId.value = undefined; // Resets resource state to idle
 * }, 7000);
 *
 * // Later, to clean up the watcher effect (if needed):
 * // disposeWatcher();
 * ```
 */
export function createResource<SourceType, DataType, ErrorType = Error>(
  sourceFn: SourceFn<SourceType>,
  fetcher: Fetcher<SourceType, DataType>,
): Resource<DataType, ErrorType> {
  const resourceState = signal<ResourceState<DataType, ErrorType>>({
    loading: false, // Start idle
  });

  let fetchId = 0; // Counter to handle race conditions
  let abortController: AbortController | null = null; // Controller for the current fetch

  // Internal function to perform the fetch and update state
  const runFetcher = async (
    currentFetchId: number,
    sourceValue: SourceType,
  ) => {
    abortController?.abort(); // Ensure previous fetch is aborted
    const controller = new AbortController(); // Create new controller
    abortController = controller;

    resourceState.value = {
      // Set loading state
      data: resourceState.peek().data,
      loading: true,
      error: undefined,
    };

    try {
      const data = await fetcher(sourceValue, { signal: controller.signal });
      // Check if still latest and not aborted
      if (fetchId === currentFetchId && !controller.signal.aborted) {
        resourceState.value = { data: data, loading: false, error: undefined };
        abortController = null;
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") {
        // console.warn('Fetch aborted'); // Optional logging
        return; // Do nothing if aborted
      }
      // Check if still latest
      if (fetchId === currentFetchId) {
        console.error("Resource fetcher error:", error);
        resourceState.value = {
          data: undefined,
          loading: false,
          error: error as ErrorType,
        };
        abortController = null;
      }
    }
  };

  // Effect to automatically fetch/refetch when the source changes
  effect(() => {
    const sourceValue = sourceFn(); // Track the source

    if (
      sourceValue !== undefined &&
      sourceValue !== null &&
      sourceValue !== false
    ) {
      fetchId++; // New fetch request ID
      void runFetcher(fetchId, sourceValue);
    } else {
      // Source is invalid, reset state
      abortController?.abort();
      abortController = null;
      fetchId++; // Invalidate any potentially ongoing fetch
      if (
        resourceState.peek().loading ||
        resourceState.peek().data !== undefined ||
        resourceState.peek().error !== undefined
      ) {
        resourceState.value = { loading: false }; // Reset to idle
      }
    }
  });

  // Manual refetch function
  const refetch = () => {
    const sourceValue = sourceFn(); // Get current source value
    if (
      sourceValue !== undefined &&
      sourceValue !== null &&
      sourceValue !== false
    ) {
      fetchId++; // New fetch request ID
      void runFetcher(fetchId, sourceValue);
    } else {
      console.warn("Refetch called but source is invalid. Resetting state.");
      abortController?.abort();
      abortController = null;
      fetchId++;
      if (
        resourceState.peek().loading ||
        resourceState.peek().data !== undefined ||
        resourceState.peek().error !== undefined
      ) {
        resourceState.value = { loading: false };
      }
    }
  };

  return {
    state: resourceState,
    refetch: refetch,
  };
}
