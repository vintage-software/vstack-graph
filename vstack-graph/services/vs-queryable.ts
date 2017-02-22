import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

import { getPropertyName, getPropertyNamesFromProjection } from '../utilities';
import { Filter, PrimaryFilter } from '../filters';

export class VsQueryable<TResult> {
  private queryString: string;
  private primaryFilter: string;
  private filters: string[] = [];
  private includes: string[] = [];
  private selects: string[] = [];

  constructor(private load: (boolean, string) => Observable<TResult[]>) { }

  withQueryString(query: string): VsQueryable<TResult> {
    if (this.primaryFilter) {
      throw new Error('Query string cannot be used with primary filter.');
    }

    if (this.filters.length) {
      throw new Error('Query string cannot be used with filter.');
    }

    if (this.includes.length) {
      throw new Error('Query string cannot be used with include.');
    }

    if (this.selects.length) {
      throw new Error('Query string cannot be used with select');
    }

    this.queryString = query;
    return this;
  }

  withPrimaryFilter(filter: PrimaryFilter<TResult>): VsQueryable<TResult> {
    if (this.queryString) {
      throw new Error('Primary filter cannot be used with query string.');
    }

    this.primaryFilter = filter.toString();
    return this;
  }

  filter(filter: Filter<TResult>): VsQueryable<TResult> {
    if (this.queryString) {
      throw new Error('Filter cannot be used with query string.');
    }

    this.filters.push(filter.toString());
    return this;
  }

  select<TInterface>(projection: (i: TResult) => any): VsQueryable<TInterface> {
    if (this.queryString) {
      throw new Error('Select cannot be used with query string.');
    }

    this.selects = getPropertyNamesFromProjection(projection);

    let queryable: any = this;
    return queryable;
  }

  include(prop: (i: TResult) => any): VsQueryable<TResult>;
  include<T1>(prop1: (i: TResult) => T1[], prop2: (i: T1) => any): VsQueryable<TResult>;
  include<T1, T2>(prop1: (i: TResult) => T1[], prop2: (i: T1) => T2[], prop3: (i: T2) => any): VsQueryable<TResult>;
  include(...props: ((i: any) => any)[]): VsQueryable<TResult> {
    if (this.queryString) {
      throw new Error('Include cannot be used with query string.');
    }

    let propNames = props
      .map(prop => getPropertyName(prop).toLowerCase());

    let propName = propNames.join('.');

    if (this.includes.indexOf(propName) === -1) {
      this.includes.push(propName);
    }

    return this;
  }

  toList(): Observable<TResult[]> {
    let queryString = this.queryString || this.buildQueryString();
    let isLoadAll = !!!queryString;
    return this.load(isLoadAll, queryString);
  }

  firstOrDefault(): Observable<TResult> {
    return this.toList()
      .map(items => items.length ? items[0] : undefined);
  }

  private buildQueryString(): string {
    let queryStringParams: string[] = [];

    if (this.primaryFilter) {
      queryStringParams.push(`primary-filter=${this.primaryFilter}`);
    }

    if (this.filters.length) {
      queryStringParams.push(`filter=${this.filters.join('|')}`);
    }

    if (this.selects.length) {
      queryStringParams.push(`select=${this.selects.join(',')}`);
    }

    if (this.includes.length) {
      queryStringParams.push(`include=${this.includes.join(',')}`);
    }

    return queryStringParams.join('&');
  }
}
