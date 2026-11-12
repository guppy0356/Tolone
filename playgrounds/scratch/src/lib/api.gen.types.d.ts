
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
export type delete_DeleteMemo = {
      method: "DELETE",
      path: "/api/memos/{id}",
      requestFormat: "json",
      responseFormat: "json",
      parameters: {
            
        path:  { id: string },
        
        
        
          }
      responses: {204: unknown,
404: unknown,
},
      
    }

  // </Endpoints>
  }
  
  
     // <EndpointByMethod>
     export type EndpointByMethod = {
     get: {
           "/api/memos": Endpoints.get_ListMemos
         },
delete: {
           "/api/memos/{id}": Endpoints.delete_DeleteMemo
         }
     }
     
     // </EndpointByMethod>
     

    // <EndpointByMethod.Shorthands>
    export type GetEndpoints = EndpointByMethod["get"]
export type DeleteEndpoints = EndpointByMethod["delete"]
    // </EndpointByMethod.Shorthands>
    