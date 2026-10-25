
  export namespace Schemas {
    // <Schemas>
  export type Memo = { id: string, title: string, status: ("draft" | "published"), createdAt: string }

    // </Schemas>
    }
  
  export namespace Endpoints {
  // <Endpoints>
  
  export type get_ListMemos = {
      method: "GET",
      path: "/api/memos",
      requestFormat: "json",
      responseFormat: "json",
      parameters: never,
      responses: {200: Array<Schemas.Memo>,
},
      
    }

  // </Endpoints>
  }
  
  
     // <EndpointByMethod>
     export type EndpointByMethod = {
     get: {
           "/api/memos": Endpoints.get_ListMemos
         }
     }
     
     // </EndpointByMethod>
     

    // <EndpointByMethod.Shorthands>
    export type GetEndpoints = EndpointByMethod["get"]
    // </EndpointByMethod.Shorthands>
    