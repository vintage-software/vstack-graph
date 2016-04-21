import { Observable } from 'rxjs/Observable';
import { RestCollection } from './rest-collection';
export interface CollectionItem {
    id: any;
}
export interface IService {
    collection$: Observable<any[]>;
    errors$: Observable<any>;
    _dangerousGraphUpdateCollection: any;
}
export interface IServiceConfig<TGraph> {
    service: IService;
    func: (graph: TGraph, collection: any[]) => void;
    mappings: Mapping[];
}
export declare class Mapping {
    collectionProperty: string;
    to: IService;
    mappingId: string;
    many: boolean;
    constructor(collectionProperty: string, to: IService, mappingId: string, many: boolean);
}
export declare class ServiceConfig<TCollectionItem extends CollectionItem, TGraph> implements IServiceConfig<TGraph> {
    service: RestCollection<TCollectionItem>;
    func: (graph: TGraph, collection: TCollectionItem[]) => void;
    mappings: Mapping[];
    constructor(service: RestCollection<TCollectionItem>, func: (graph: TGraph, collection: TCollectionItem[]) => void, mappings: Mapping[]);
}
export declare function clone(obj: any): any;
export declare function deepmerge(target: any, src: any): any;
export declare function slimify(item: any): any;
export declare function isPrimitive(item: any): boolean;
