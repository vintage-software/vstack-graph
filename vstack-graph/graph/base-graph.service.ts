import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Observable} from 'rxjs/Observable';
import 'rxjs/Rx'; // TODO: we just want combineLatest

import {CollectionItem, clone, mergeCollection} from '../utilities';
import {IServiceConfig, Relation, ServiceConfig} from './graph-utilities';

export class BaseGraphService<TGraph> {
    private _debug: boolean = false;
    graph$: Observable<TGraph>;

    constructor(private _serviceConfigs: IServiceConfig<TGraph>[]) {
        this.graph$ = Observable
            .combineLatest(this._serviceConfigs.map(i => (<any>i.service)._collection$))
            .map(i => this._slimifyCollection(i))
            .share()
            .map(i => i.map(array => clone(array)))
            .map(i => this._toGraph(i));
    }

    private _slimifyCollection(collection: any[]) {
        let changes = true;
        while (changes === true) {
            changes = false;
            this._serviceConfigs.forEach((serviceConfig, index) => {
                serviceConfig.relations.forEach((relation: Relation) =>
                    collection[index].forEach((collectionItem: CollectionItem) => {
                        let mappingService = this._serviceConfigs.find(i => i.service === relation.to);
                        let mappingIndex = this._serviceConfigs.indexOf(mappingService);
                        let collectionItemsToUpdate = [];
                        
                        if (!!collectionItem[relation.collectionProperty]) {
                            changes = true;
                            
                            if (relation.many) {
                                collectionItemsToUpdate = collectionItem[relation.collectionProperty];
                            } else {
                                collectionItemsToUpdate.push(collectionItem[relation.collectionProperty]);
                            }
                            
                            collectionItem[relation.collectionProperty] = null;
                            mergeCollection(collection[mappingIndex], collectionItemsToUpdate);
                            collection[mappingIndex] = collection[mappingIndex].filter(i => i[relation.relationId] !== collectionItem.id || collectionItemsToUpdate.find(j => j.id === i.id));
                        }
                    })
                );
            });
        }

        this._debug && console.log('Collection: ', collection);
        return collection;
    }

    private _toGraph(collection: any[]): TGraph {
        let graph = <TGraph>{};

        this._serviceConfigs.forEach((serviceConfig, index) => {
            serviceConfig.relations.forEach((relation: Relation) =>
                collection[index].forEach((collectionItem: CollectionItem) => {
                    let mappingService = this._serviceConfigs.find(i => i.service === relation.to);
                    let mappingIndex = this._serviceConfigs.indexOf(mappingService);
                    
                    if (relation.many) {
                        collectionItem[relation.collectionProperty] = collection[mappingIndex].filter(i => i[relation.relationId] === collectionItem.id);
                    } else {
                        collectionItem[relation.collectionProperty] = collection[mappingIndex].find(i => i.id === collectionItem[relation.relationId]);
                    }
                })
            );

            serviceConfig.func(graph, collection[index]);
        });

        return graph;
    }
}