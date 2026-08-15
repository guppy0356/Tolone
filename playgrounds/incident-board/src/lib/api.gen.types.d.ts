
  export namespace Schemas {
    // <Schemas>
  export type IncidentStatus = ("open" | "acknowledged" | "resolved")
export type IncidentSeverity = ("low" | "medium" | "high" | "critical")
export type IncidentSort = ("openedAt" | "-openedAt" | "severity" | "-severity")
export type User = { id: string, name: string }
export type IncidentSummary = {
  id: string;
  /**
   * Human-facing identifier, e.g. INC-1043.
   */
  key: string;
  title: string;
  status: IncidentStatus;
  severity: IncidentSeverity;
  /**
   * null when nobody has picked the incident up.
   */
  assignee: (User | null);
  openedAt: string;
}
export type TimelineEvent = { id: string, at: string, kind: ("opened" | "acknowledged" | "resolved" | "note"), actor: string, message: string }
export type IncidentDetail = { id: string, key: string, title: string, status: IncidentStatus, severity: IncidentSeverity, assignee: (User | null), openedAt: string, description: string, timeline: Array<TimelineEvent> }
export type Comment = { id: string, author: string, body: string, postedAt: string }
export type IncidentPage = { items: Array<IncidentSummary>, page: number, perPage: number, total: number, totalPages: number }

    // </Schemas>
    }
  
  export namespace Endpoints {
  // <Endpoints>
  
  export type get__api_incidents = {
      method: "GET",
      path: "/api/incidents",
      requestFormat: "json",
      responseFormat: "json",
      parameters: {
            query?:  Partial<{ status: Array<Schemas.IncidentStatus>, severity: Schemas.IncidentSeverity, assignee: string, sort: Schemas.IncidentSort, page: number }>,
        
        
        
        
          }
      responses: {200: Schemas.IncidentPage,
},
      
    }
export type get__api_incidents_IncidentId = {
      method: "GET",
      path: "/api/incidents/{incidentId}",
      requestFormat: "json",
      responseFormat: "json",
      parameters: {
            
        path:  { incidentId: string },
        
        
        
          }
      responses: {200: Schemas.IncidentDetail,
404: unknown,
},
      
    }
export type get__api_incidents_IncidentId_comments = {
      method: "GET",
      path: "/api/incidents/{incidentId}/comments",
      requestFormat: "json",
      responseFormat: "json",
      parameters: {
            
        path:  { incidentId: string },
        
        
        
          }
      responses: {200: Array<Schemas.Comment>,
404: unknown,
},
      
    }
export type get__api_users = {
      method: "GET",
      path: "/api/users",
      requestFormat: "json",
      responseFormat: "json",
      parameters: never,
      responses: {200: Array<Schemas.User>,
},
      
    }

  // </Endpoints>
  }
  
  
     // <EndpointByMethod>
     export type EndpointByMethod = {
     get: {
           "/api/incidents": Endpoints.get__api_incidents,
"/api/incidents/{incidentId}": Endpoints.get__api_incidents_IncidentId,
"/api/incidents/{incidentId}/comments": Endpoints.get__api_incidents_IncidentId_comments,
"/api/users": Endpoints.get__api_users
         }
     }
     
     // </EndpointByMethod>
     

    // <EndpointByMethod.Shorthands>
    export type GetEndpoints = EndpointByMethod["get"]
    // </EndpointByMethod.Shorthands>
    