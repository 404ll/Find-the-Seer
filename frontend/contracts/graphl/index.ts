import { graphql } from '@mysten/sui/graphql/schemas/latest'

export const getObjectInfo = graphql(`
  query GetObjectInfo($objectId: SuiAddress!) {
    object(address: $objectId) {
      address
      version
      asMoveObject {
        contents {
          json
        }
      }
    }
  }
`)


export const getTableVecContent = graphql(`
  query GetTableVecContent($tableVecId: SuiAddress!, $after: String) {
    object(address: $tableVecId) {
      asMoveObject {
        dynamicFields(after: $after) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            name {
              json
            }
            value {
              ... on MoveObject {
                contents {
                  json
                }
              }
              ... on MoveValue {
                json
              }
            }
          }
        }
      }
    }
  }
`)

export const getCustodianInfo = graphql(`
  query GetCustodianInfo($objectId: SuiAddress!) {
    object(address: $objectId) {
      address
      version
      asMoveObject {
        contents {
          json
        }
      }
    }
  }
`)

export const getTableContent = graphql(`
  query GetTableContent($tableId: SuiAddress!, $after: String) {
    owner(address: $tableId) {
        dynamicFields(after: $after) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            name {
              json
            }
            value {
            __typename
            ... on MoveValue {
              json
            }
            ... on MoveObject {
              contents {
                json
              }
            }
          }
        }
      }
    }
  }
`)

