import {
  HttpResponse,
  http as mswHttp,
  type DefaultBodyType,
  type JsonBodyType,
  type StrictRequest,
} from "msw";
import { EndpointByMethod, type GetEndpoints } from "../lib/api.gen";

// A hand-rolled typed layer over plain msw, driven entirely by the generated
// contract module. The path argument is a key of `GetEndpoints` (the contract
// literal, `{param}` style), and the resolver mirrors the surface handlers
// already use: `{ request, params, response }` with `response(status)`
// restricted to the statuses the contract declares for that path.

type EndpointResponses<TPath extends keyof GetEndpoints> =
  GetEndpoints[TPath]["responses"];

type DeclaredStatus<TPath extends keyof GetEndpoints> = number &
  keyof EndpointResponses<TPath>;

type PathParamsOf<TPath extends keyof GetEndpoints> = [
  GetEndpoints[TPath]["parameters"],
] extends [never]
  ? Record<string, never>
  : GetEndpoints[TPath]["parameters"] extends { path: infer TParams }
    ? TParams
    : Record<string, never>;

// typed-openapi emits `unknown` for a status the contract declares without a
// body, so that is the discriminator: bodyless statuses get `.empty()` only,
// body-bearing statuses get `.json()` typed to the contract's body.
type TypedResponseFn<TPath extends keyof GetEndpoints> = <
  TStatus extends DeclaredStatus<TPath>,
>(
  status: TStatus,
) => unknown extends EndpointResponses<TPath>[TStatus]
  ? { empty: () => Response }
  : { json: (body: EndpointResponses<TPath>[TStatus]) => Response };

type TypedResolverInfo<TPath extends keyof GetEndpoints> = {
  request: StrictRequest<DefaultBodyType>;
  params: PathParamsOf<TPath>;
  response: TypedResponseFn<TPath>;
};

type TypedResolver<TPath extends keyof GetEndpoints> = (
  info: TypedResolverInfo<TPath>,
) => Response | Promise<Response>;

// The generated module exports every endpoint twice under one name: the type
// used above, and a runtime object whose `responses` values are zod schemas.
// `EndpointByMethod.get` is the runtime map keyed by contract path, but it is
// declared with the type-level shape, so the zod surface is recovered by cast.
type ZodParser = { parse: (input: unknown) => unknown };

const runtimeGetEndpoints = EndpointByMethod.get as unknown as Record<
  keyof GetEndpoints,
  { responses: Partial<Record<number, ZodParser>> }
>;

// "/api/incidents/{incidentId}" -> "/api/incidents/:incidentId"
function toMswPath(path: string): string {
  return path.replace(/\{([^}]+)\}/g, ":$1");
}

function get<TPath extends keyof GetEndpoints>(
  path: TPath,
  resolver: TypedResolver<TPath>,
) {
  const responseSchemas = runtimeGetEndpoints[path].responses;

  const response = ((status: number) => ({
    json: (body: unknown) => {
      const schema = responseSchemas[status];
      if (schema === undefined) {
        throw new Error(`No response schema for ${status} on GET ${path}`);
      }
      // Parse, not just check: a mock that drifts from the contract fails the
      // test loudly, and the wire body is exactly the schema's output.
      return HttpResponse.json(schema.parse(body) as JsonBodyType, { status });
    },
    empty: () => new HttpResponse(null, { status }),
  })) as unknown as TypedResponseFn<TPath>;

  return mswHttp.get(toMswPath(path), (info) =>
    resolver({
      request: info.request,
      params: info.params as PathParamsOf<TPath>,
      response,
    }),
  );
}

export const http = { get };
