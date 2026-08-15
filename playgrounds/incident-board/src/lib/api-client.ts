import ky, { HTTPError } from "ky";
import { createApiClient, type Fetcher, type FetcherResponse } from "./api.gen";

// ky's status-code retry only runs while it throws, so HTTPError is caught
// *after* the retries and handed back as a response. ky has already consumed
// the error body into `error.data`, so the response serves that.
const fetcher: Fetcher = {
  fetch: async ({ url, method, urlSearchParams, parameters, requestFormat, overrides }) => {
    try {
      return await ky(url, {
        method,
        searchParams: urlSearchParams,
        ...(requestFormat === "json" && parameters?.body !== undefined
          ? { json: parameters.body }
          : {}),
        ...overrides,
      });
    } catch (error) {
      if (error instanceof HTTPError) {
        const { response } = error;
        const errorResponse: FetcherResponse = {
          ok: false,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          json: async () => error.data,
          text: async () =>
            typeof error.data === "string" ? error.data : JSON.stringify(error.data),
          arrayBuffer: async () => new ArrayBuffer(0),
          clone: () => errorResponse,
        };
        return errorResponse;
      }
      throw error;
    }
  },
};

// The client resolves paths against an absolute base URL. Input validation
// stays off: request shapes are TS-owned end to end, and zod input parsing
// would rewrite them (a defaulted contract param gets injected into the
// query string).
export const api = createApiClient(fetcher, window.location.origin, {
  validate: "output",
});

export { TypedStatusError } from "./api.gen";
