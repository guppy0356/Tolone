import { http as mswHttp, HttpResponse, type HttpHandler } from "msw";
import { EndpointByMethod } from "../lib/api.gen";

type Endpoints = typeof EndpointByMethod;

type BodyOf<E> = E extends { parameters: { body: infer B } } ? B : never;
type ParamsOf<E> = E extends { parameters: { path: infer P } }
  ? P
  : Record<string, never>;
type ResponsesOf<E> = E extends { responses: infer R } ? R : never;

// A status the contract gives no body offers `.empty()` alone; a body-bearing
// one offers `.json(body)` typed to the contract.
type HasBody<T> = [T] extends [never]
  ? false
  : [unknown] extends [T]
    ? false
    : true;

type ResponseBuilder<TBody> = HasBody<TBody> extends true
  ? { json: (body: TBody) => Response }
  : { empty: () => Response };

type Responder<E> = <TStatus extends keyof ResponsesOf<E> & number>(
  status: TStatus,
) => ResponseBuilder<ResponsesOf<E>[TStatus]>;

interface ResolverArgs<E> {
  request: Omit<Request, "json"> & { json: () => Promise<BodyOf<E>> };
  params: ParamsOf<E>;
  response: Responder<E>;
}

type Resolver<E> = (args: ResolverArgs<E>) => Response | Promise<Response>;

// The contract's own path literals are {param} style; msw wants :param.
const toMswPath = (path: string) => path.replace(/{(\w+)}/g, ":$1");

// The generated module exports each endpoint twice under one name — the type
// for annotations, the zod value for runtime — so the schema behind a status is
// read off the value the annotation hides. Parsing here is what makes a mock
// that drifts from the contract fail loudly.
type ZodSchema = { parse: (value: unknown) => unknown };
const endpoints = EndpointByMethod as unknown as Record<
  string,
  Record<string, { responses: Record<string, ZodSchema> }>
>;

function handler<M extends keyof Endpoints, P extends keyof Endpoints[M] & string>(
  method: M & string,
  path: P,
  resolver: Resolver<Endpoints[M][P]>,
): HttpHandler {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response: any = (status: number) => ({
    json: (body: unknown) =>
      HttpResponse.json(
        endpoints[method][path].responses[String(status)].parse(body) as never,
        { status },
      ),
    empty: () => new HttpResponse(null, { status }),
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (mswHttp as any)[method](
    toMswPath(path),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async ({ request, params }: any) => resolver({ request, params, response }),
  );
}

// Carries exactly the methods this playground's contract uses; the next one
// adds its own.
export const http = {
  post: <P extends keyof Endpoints["post"] & string>(
    path: P,
    resolver: Resolver<Endpoints["post"][P]>,
  ) => handler("post", path, resolver),
};
