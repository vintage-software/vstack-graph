import { CollectionItem, Id, QueryString } from '../utilities';
import { VsElasticQueryable } from './vs-elastic-queryable';

import { RemotePersistenceMapper } from '../mappers/remote-persistence.mapper';
import { RemoteCollectionService } from './remote-collection.service';

export abstract class VsElasticCollectionService<TItem extends CollectionItem> extends RemoteCollectionService<TItem> {
  constructor(remotePersistenceMapper: RemotePersistenceMapper<TItem>) {
    super(remotePersistenceMapper);
  }

  get(id: Id): VsElasticQueryable<TItem> {
    return new VsElasticQueryable<TItem>((_isLoadAll: boolean, options: QueryString) => this.load(id, options));
  }

  getAll(): VsElasticQueryable<TItem> {
    return new VsElasticQueryable<TItem>((isLoadAll: boolean, options: QueryString) => this.loadMany(isLoadAll, options));
  }
}
