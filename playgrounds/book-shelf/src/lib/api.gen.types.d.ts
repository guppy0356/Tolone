
  export namespace Schemas {
    // <Schemas>
  export type Book = { id: string, isbn13: string, title: string, coverUrl: string, authors: Array<string>, publisher: string, registeredAt: string }
export type CreateBookInput = { isbn13: string }

    // </Schemas>
    }
  
  export namespace Endpoints {
  // <Endpoints>
  
  export type post__api_books = {
      method: "POST",
      path: "/api/books",
      requestFormat: "json",
      responseFormat: "json",
      parameters: {
            
        
        
        
        body:  Schemas.CreateBookInput,
          }
      responses: {201: Schemas.Book,
},
      
    }

  // </Endpoints>
  }
  
  
     // <EndpointByMethod>
     export type EndpointByMethod = {
     post: {
           "/api/books": Endpoints.post__api_books
         }
     }
     
     // </EndpointByMethod>
     

    // <EndpointByMethod.Shorthands>
    export type PostEndpoints = EndpointByMethod["post"]
    // </EndpointByMethod.Shorthands>
    