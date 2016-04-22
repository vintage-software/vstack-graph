[![Build Status](https://travis-ci.org/vintage-software/vstack-graph.svg?branch=master)](https://travis-ci.org/vintage-software/vstack-graph)

# VStack Graph

## Work in progress

A Reactive Http REST library with relational data structure support. Supports Angular 2 out of the box. Adding
Angular 1 and generic browser support as well. 

### RestCollection

`RestCollection` is a base class to extend rest services from. This base class will add CRUD functionality
as well as features such as state history tracking, error logging and Flux like collection streams.

`RestCollection` has a peer dependency on RxJS 5.

### GraphService

Work in progress. Will allow defined relationships between Restfull collections created with 
the `RestCollection` allowing data deduping and graph like structures in client apps.


### Getting Started

This project is in alpha and a work in progress. To get started run `npm install` in the root directory.

- `npm run build` create distributables and bundles
- `npm run test` build and run tests
- `npm run coverage` build and run test coverage

Temp Demo: http://plnkr.co/edit/RcQO38Bztxnhnch1I12W?p=preview
