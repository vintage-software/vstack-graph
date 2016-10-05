declare module "vstack-graph/utilities" {
    export interface CollectionItem {
        id: string | number;
    }
    export function clone(obj: any): any;
    export function mergeCollection<TItem extends CollectionItem>(target: TItem[], src: TItem[]): void;
    export function mergeCollectionItem<TItem extends CollectionItem>(target: TItem, src: TItem): void;
    export function slimify<TItem>(item: TItem): TItem;
    export function isPrimitive(item: any): boolean;
}
declare module "vstack-graph/services/local.service" {
    import { Observable } from 'rxjs/Observable';
    import { BehaviorSubject } from 'rxjs/BehaviorSubject';
    import { Subject } from 'rxjs/Subject';
    import 'rxjs/add/operator/map';
    import { CollectionItem } from "vstack-graph/utilities";
    export interface LocalPersistenceMapper<TItem extends CollectionItem> {
        create(items: TItem[], options: string): Observable<TItem[]>;
        update(items: TItem[], options: string): Observable<TItem[]>;
        delete(ids: any[], options: string): Observable<any>;
    }
    export abstract class LocalCollectionService<TItem extends CollectionItem> {
        protected _mapper: LocalPersistenceMapper<TItem>;
        protected _collection: BehaviorSubject<TItem[]>;
        protected _errors: Subject<{}>;
        protected _history: Subject<{}>;
        protected dataStore: {
            collection: TItem[];
        };
        private historyStore;
        constructor(_mapper: LocalPersistenceMapper<TItem>);
        readonly collection: Observable<TItem[]>;
        readonly errors: Observable<any>;
        readonly history: Observable<{
            action: string;
            state: {
                collection: TItem[];
            };
        }[]>;
        create(item: any | TItem, options?: string): Observable<TItem>;
        createMany(items: TItem[], options?: string): Observable<TItem[]>;
        update(item: any | TItem, options?: string): Observable<TItem>;
        updateMany(items: TItem[], options?: string): Observable<TItem[]>;
        delete(id: any, options?: string): Observable<any>;
        deleteMany(ids: any[], options?: string): Observable<any[]>;
        protected recordHistory(action: string): void;
        protected removeCollectionItems(ids: any[]): void;
        protected assignIds(items: any[]): void;
        private getGuid();
        private s4();
    }
}
declare module "vstack-graph/graph/graph-utilities" {
    import { Observable } from 'rxjs/Observable';
    import { LocalCollectionService } from "vstack-graph/services/local.service";
    import { CollectionItem } from "vstack-graph/utilities";
    export interface IService {
        collection: Observable<CollectionItem[]>;
        errors: Observable<any>;
    }
    export interface IServiceConfig<TGraph> {
        service: IService;
        func: (graph: TGraph, collection: CollectionItem[]) => void;
        relations: Relation[];
    }
    export class Relation {
        collectionProperty: string;
        to: IService;
        relationId: string;
        many: boolean;
        constructor(collectionProperty: string, to: IService, relationId: string, many: boolean);
    }
    export class ServiceConfig<TCollectionItem extends CollectionItem, TGraph> implements IServiceConfig<TGraph> {
        service: LocalCollectionService<TCollectionItem>;
        func: (graph: TGraph, collection: TCollectionItem[]) => void;
        relations: Relation[];
        constructor(service: LocalCollectionService<TCollectionItem>, func: (graph: TGraph, collection: TCollectionItem[]) => void, relations: Relation[]);
    }
}
declare module "vstack-graph/graph/base-graph.service" {
    import { Observable } from 'rxjs/Observable';
    import 'rxjs/add/observable/combineLatest';
    import { IServiceConfig } from "vstack-graph/graph/graph-utilities";
    export class BaseGraphService<TGraph> {
        private serviceConfigs;
        graph: Observable<TGraph>;
        constructor(serviceConfigs: IServiceConfig<TGraph>[]);
        private slimifyCollection(collection);
        private collectionItemHasRelation(collectionItem, relation);
        private toGraph(collection);
        private mapCollectionItemPropertyFromRelation(collectionItem, collection, relation);
    }
}
declare module "vstack-graph/services/vs-queryable" {
    import { Observable } from 'rxjs/Observable';
    export class VsQueryable<TResult> {
        private load;
        private queryString;
        constructor(load: (boolean, string) => Observable<TResult>);
        getQueryString(): string;
        toList(): Observable<TResult>;
        withQueryString(queryString: string): VsQueryable<TResult>;
    }
}
declare module "vstack-graph/services/remote.service" {
    import { Observable } from 'rxjs/Observable';
    import { ReplaySubject } from 'rxjs/ReplaySubject';
    import { LocalCollectionService, LocalPersistenceMapper } from "vstack-graph/services/local.service";
    import { CollectionItem } from "vstack-graph/utilities";
    import { VsQueryable } from "vstack-graph/services/vs-queryable";
    export interface RemotePersistenceMapper<TItem extends CollectionItem> extends LocalPersistenceMapper<TItem> {
        load(id: any, options: string): Observable<TItem>;
        loadMany(options: string): Observable<TItem[]>;
    }
    export abstract class BaseRemoteService<TItem extends CollectionItem> extends LocalCollectionService<TItem> {
        private remotePersistenceMapper;
        constructor(remotePersistenceMapper: RemotePersistenceMapper<TItem>);
        readonly _remoteMapper: RemotePersistenceMapper<TItem>;
        protected load(id: any, options: string): ReplaySubject<TItem>;
        protected loadMany(isLoadAll: boolean, options: string): ReplaySubject<TItem[]>;
    }
    export abstract class CollectionService<TItem extends CollectionItem> extends BaseRemoteService<TItem> {
        constructor(remotePersistenceMapper: RemotePersistenceMapper<TItem>);
        get(id: any, options?: string): Observable<TItem>;
        getAll(options?: string): Observable<TItem[]>;
    }
    export abstract class VSCollectionService<TItem extends CollectionItem> extends BaseRemoteService<TItem> {
        constructor(remotePersistenceMapper: RemotePersistenceMapper<TItem>);
        get(id: any): VsQueryable<TItem>;
        getAll(): VsQueryable<TItem[]>;
    }
}
declare module "vstack-graph/services/angular-http" {
    import { RemotePersistenceMapper } from "vstack-graph/services/remote.service";
    import { Observable } from 'rxjs/Observable';
    import { CollectionItem } from "vstack-graph/utilities";
    export class AngularHttpMapper<TItem extends CollectionItem> implements RemotePersistenceMapper<TItem> {
        protected baseUrl: string;
        protected requestOptionsArgs: any;
        private http;
        constructor({baseUrl, http, options}: {
            baseUrl: string;
            http: any;
            options?: {};
        });
        create(items: TItem[], options?: string): Observable<TItem[]>;
        update(items: TItem[], options?: string): Observable<TItem[]>;
        delete(ids: string[] | number[], options?: string): Observable<any>;
        load(id: string | number, options?: string): any;
        loadMany(options?: string): any;
    }
}
declare module "index" {
    import { BaseGraphService } from "vstack-graph/graph/base-graph.service";
    import { ServiceConfig, Relation } from "vstack-graph/graph/graph-utilities";
    import { VSCollectionService, CollectionService } from "vstack-graph/services/remote.service";
    import { LocalCollectionService } from "vstack-graph/services/local.service";
    import { AngularHttpMapper } from "vstack-graph/services/angular-http";
    import { CollectionItem } from "vstack-graph/utilities";
    export { LocalCollectionService, CollectionService, VSCollectionService, BaseGraphService, CollectionItem, ServiceConfig, Relation, AngularHttpMapper };
}
