var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
System.register("vstack-graph/utilities", [], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    function clone(obj) {
        var copy;
        if (null === obj || 'object' !== typeof obj) {
            return obj;
        }
        if (obj instanceof Date) {
            copy = new Date();
            copy.setTime(obj.getTime());
            return copy;
        }
        if (obj instanceof Array) {
            copy = [];
            for (var i = 0, len = obj.length; i < len; i++) {
                copy[i] = clone(obj[i]);
            }
            return copy;
        }
        if (obj instanceof Object) {
            copy = {};
            for (var attr in obj) {
                if (obj.hasOwnProperty(attr))
                    copy[attr] = clone(obj[attr]);
            }
            return copy;
        }
        throw new Error('Unable to copy');
    }
    exports_1("clone", clone);
    function mergeCollection(target, src) {
        src.filter(function (i) { return i && i.id; }).forEach(function (srcItem) {
            var match = target.find(function (tItem) { return tItem.id === srcItem.id; });
            if (match) {
                Object.assign(match, srcItem);
            }
            else {
                target.push(srcItem);
            }
        });
    }
    exports_1("mergeCollection", mergeCollection);
    function slimify(item) {
        var newItem = {};
        for (var prop in item) {
            if (isPrimitive(item[prop])) {
                newItem[prop] = item[prop];
            }
            else {
                newItem[prop] = null;
            }
        }
        return newItem;
    }
    exports_1("slimify", slimify);
    function isPrimitive(item) {
        return Object.prototype.toString.call(item) === '[object Date]' || typeof item !== 'object' || item === null;
    }
    exports_1("isPrimitive", isPrimitive);
    return {
        setters:[],
        execute: function() {
        }
    }
});
System.register("vstack-graph/services/local.service", ['rxjs/subject/ReplaySubject', 'rxjs/subject/BehaviorSubject', 'rxjs/add/operator/map', "vstack-graph/utilities"], function(exports_2, context_2) {
    "use strict";
    var __moduleName = context_2 && context_2.id;
    var ReplaySubject_1, BehaviorSubject_1, utilities_1;
    var LocalCollectionService;
    return {
        setters:[
            function (ReplaySubject_1_1) {
                ReplaySubject_1 = ReplaySubject_1_1;
            },
            function (BehaviorSubject_1_1) {
                BehaviorSubject_1 = BehaviorSubject_1_1;
            },
            function (_1) {},
            function (utilities_1_1) {
                utilities_1 = utilities_1_1;
            }],
        execute: function() {
            LocalCollectionService = (function () {
                function LocalCollectionService(_mapper) {
                    this._mapper = _mapper;
                    this._collection$ = new BehaviorSubject_1.BehaviorSubject([]);
                    this._errors$ = new BehaviorSubject_1.BehaviorSubject({});
                    this._history$ = new BehaviorSubject_1.BehaviorSubject({});
                    this._dataStore = { collection: [] };
                    this._historyStore = [];
                    this._recordHistory('INIT');
                }
                Object.defineProperty(LocalCollectionService.prototype, "collection$", {
                    get: function () {
                        return this._collection$.map(function (collection) { return utilities_1.clone(collection); });
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(LocalCollectionService.prototype, "errors$", {
                    get: function () {
                        return this._errors$;
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(LocalCollectionService.prototype, "history$", {
                    get: function () {
                        return this._history$;
                    },
                    enumerable: true,
                    configurable: true
                });
                LocalCollectionService.prototype.create = function (item) {
                    return this.createMany([item])
                        .map(function (items) { return items.find(function (i) { return true; }); });
                };
                LocalCollectionService.prototype.createMany = function (items) {
                    var _this = this;
                    var completion$ = new ReplaySubject_1.ReplaySubject(1);
                    this._assignIds(items);
                    this._mapper.create(items.map(function (i) { return utilities_1.slimify(i); })).subscribe(function (items) {
                        utilities_1.mergeCollection(_this._dataStore.collection, items);
                        _this._recordHistory('CREATE');
                        completion$.next(utilities_1.clone(items));
                        completion$.complete();
                        _this._collection$.next(_this._dataStore.collection);
                    }, function (error) { _this._errors$.next(error); completion$.error(error); });
                    return completion$;
                };
                LocalCollectionService.prototype.update = function (item) {
                    return this.updateMany([item])
                        .map(function (items) { return items.find(function (i) { return true; }); });
                };
                LocalCollectionService.prototype.updateMany = function (items) {
                    var _this = this;
                    var completion$ = new ReplaySubject_1.ReplaySubject(1);
                    this._mapper.update(items.map(function (i) { return utilities_1.slimify(i); })).subscribe(function (items) {
                        utilities_1.mergeCollection(_this._dataStore.collection, items);
                        _this._recordHistory('UPDATE');
                        completion$.next(utilities_1.clone(items));
                        completion$.complete();
                        _this._collection$.next(_this._dataStore.collection);
                    }, function (error) { _this._errors$.next(error); completion$.error(error); });
                    return completion$;
                };
                LocalCollectionService.prototype.delete = function (id) {
                    return this.deleteMany([id])
                        .map(function (items) { return items.find(function (i) { return true; }); });
                };
                LocalCollectionService.prototype.deleteMany = function (ids) {
                    var _this = this;
                    var completion$ = new ReplaySubject_1.ReplaySubject(1);
                    this._mapper.delete(ids).subscribe(function (ids) {
                        _this._removeCollectionItems(ids);
                        _this._recordHistory('DELETE');
                        completion$.next(ids);
                        completion$.complete();
                        _this._collection$.next(_this._dataStore.collection);
                    }, function (error) { _this._errors$.next(error); completion$.error(error); });
                    return completion$;
                };
                LocalCollectionService.prototype._recordHistory = function (action) {
                    if (this._historyStore.length >= 100) {
                        this._historyStore.shift();
                    }
                    this._historyStore.push({ action: action, state: this._dataStore });
                    this._history$.next(this._historyStore);
                };
                LocalCollectionService.prototype._removeCollectionItems = function (ids) {
                    this._dataStore = Object.assign({}, this._dataStore, {
                        collection: this._dataStore.collection.filter(function (item) { return !ids.find(function (id) { return id === item.id; }); })
                    });
                };
                LocalCollectionService.prototype._assignIds = function (items) {
                    var _this = this;
                    items.forEach(function (i) { return i.id = _this._getGuid(); });
                };
                LocalCollectionService.prototype._getGuid = function () {
                    function s4() {
                        return Math.floor((1 + Math.random()) * 0x10000)
                            .toString(16)
                            .substring(1);
                    }
                    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
                        s4() + '-' + s4() + s4() + s4();
                };
                return LocalCollectionService;
            }());
            exports_2("LocalCollectionService", LocalCollectionService);
        }
    }
});
System.register("vstack-graph/graph/graph-utilities", [], function(exports_3, context_3) {
    "use strict";
    var __moduleName = context_3 && context_3.id;
    var Relation, ServiceConfig;
    return {
        setters:[],
        execute: function() {
            Relation = (function () {
                function Relation(collectionProperty, to, mappingId, many) {
                    this.collectionProperty = collectionProperty;
                    this.to = to;
                    this.mappingId = mappingId;
                    this.many = many;
                }
                return Relation;
            }());
            exports_3("Relation", Relation);
            ServiceConfig = (function () {
                function ServiceConfig(service, func, mappings) {
                    this.service = service;
                    this.func = func;
                    this.mappings = mappings;
                }
                return ServiceConfig;
            }());
            exports_3("ServiceConfig", ServiceConfig);
        }
    }
});
System.register("vstack-graph/graph/base-graph.service", ['rxjs/Observable', 'rxjs/add/operator/combineLatest', 'rxjs/add/operator/startWith', 'rxjs/add/operator/skip', 'rxjs/add/operator/do', 'rxjs/Rx', "vstack-graph/utilities"], function(exports_4, context_4) {
    "use strict";
    var __moduleName = context_4 && context_4.id;
    var Observable_1, utilities_2;
    var BaseGraphService;
    return {
        setters:[
            function (Observable_1_1) {
                Observable_1 = Observable_1_1;
            },
            function (_2) {},
            function (_3) {},
            function (_4) {},
            function (_5) {},
            function (_6) {},
            function (utilities_2_1) {
                utilities_2 = utilities_2_1;
            }],
        execute: function() {
            BaseGraphService = (function () {
                function BaseGraphService(_serviceConfigs) {
                    var _this = this;
                    this._serviceConfigs = _serviceConfigs;
                    this._debug = false;
                    this.graph$ = Observable_1.Observable
                        .combineLatest(this._serviceConfigs.map(function (i) { return i.service._collection$; }))
                        .map(function (i) { return _this._slimify(i); })
                        .share()
                        .map(function (i) { return i.map(function (array) { return utilities_2.clone(array); }); })
                        .map(function (i) { return _this._toGraph(i); });
                }
                BaseGraphService.prototype._slimify = function (master) {
                    var _this = this;
                    var changes = true;
                    while (changes === true) {
                        changes = false;
                        this._serviceConfigs.forEach(function (serviceConfig, index) {
                            serviceConfig.mappings.forEach(function (mapping) {
                                return master[index].forEach(function (dto) {
                                    var mappingService = _this._serviceConfigs.find(function (i) { return i.service === mapping.to; });
                                    var mappingIndex = _this._serviceConfigs.indexOf(mappingService);
                                    var toUpdate = [];
                                    if (!!dto[mapping.collectionProperty]) {
                                        changes = true;
                                        if (mapping.many) {
                                            toUpdate = dto[mapping.collectionProperty];
                                        }
                                        else {
                                            toUpdate.push(dto[mapping.collectionProperty]);
                                        }
                                        dto[mapping.collectionProperty] = null;
                                        utilities_2.mergeCollection(master[mappingIndex], toUpdate);
                                        master[mappingIndex] = master[mappingIndex].filter(function (i) { return i[mapping.mappingId] !== dto.id || toUpdate.find(function (j) { return j.id === i.id; }); });
                                    }
                                });
                            });
                        });
                    }
                    this._debug && console.log('master', master);
                    return master;
                };
                BaseGraphService.prototype._toGraph = function (master) {
                    var _this = this;
                    var graph = {};
                    this._serviceConfigs.forEach(function (serviceConfig, index) {
                        serviceConfig.mappings.forEach(function (mapping) {
                            return master[index].forEach(function (dto) {
                                var mappingService = _this._serviceConfigs.find(function (i) { return i.service === mapping.to; });
                                var mappingIndex = _this._serviceConfigs.indexOf(mappingService);
                                if (mapping.many) {
                                    dto[mapping.collectionProperty] = master[mappingIndex].filter(function (i) { return i[mapping.mappingId] === dto.id; });
                                }
                                else {
                                    dto[mapping.collectionProperty] = master[mappingIndex].find(function (i) { return i.id === dto[mapping.mappingId]; });
                                }
                            });
                        });
                        serviceConfig.func(graph, master[index]);
                    });
                    return graph;
                };
                return BaseGraphService;
            }());
            exports_4("BaseGraphService", BaseGraphService);
        }
    }
});
System.register("vstack-graph/services/vs-queryable", [], function(exports_5, context_5) {
    "use strict";
    var __moduleName = context_5 && context_5.id;
    var VsQueryable;
    return {
        setters:[],
        execute: function() {
            VsQueryable = (function () {
                function VsQueryable(_load) {
                    this._load = _load;
                }
                VsQueryable.prototype.getQueryString = function () {
                    return this._queryString;
                };
                VsQueryable.prototype.toList = function () {
                    var qs = this.getQueryString();
                    var isLoadAll = !!!qs;
                    return this._load(isLoadAll, qs);
                };
                VsQueryable.prototype.withQueryString = function (queryString) {
                    this._queryString = queryString;
                    return this;
                };
                return VsQueryable;
            }());
            exports_5("VsQueryable", VsQueryable);
        }
    }
});
System.register("vstack-graph/services/remote.service", ['rxjs/subject/ReplaySubject', "vstack-graph/services/local.service", "vstack-graph/utilities", "vstack-graph/services/vs-queryable"], function(exports_6, context_6) {
    "use strict";
    var __moduleName = context_6 && context_6.id;
    var ReplaySubject_2, local_service_1, utilities_3, vs_queryable_1;
    var BaseRemoteService, CollectionService, VSCollectionService;
    return {
        setters:[
            function (ReplaySubject_2_1) {
                ReplaySubject_2 = ReplaySubject_2_1;
            },
            function (local_service_1_1) {
                local_service_1 = local_service_1_1;
            },
            function (utilities_3_1) {
                utilities_3 = utilities_3_1;
            },
            function (vs_queryable_1_1) {
                vs_queryable_1 = vs_queryable_1_1;
            }],
        execute: function() {
            BaseRemoteService = (function (_super) {
                __extends(BaseRemoteService, _super);
                function BaseRemoteService(_remotePersistenceMapper) {
                    _super.call(this, _remotePersistenceMapper);
                    this._remotePersistenceMapper = _remotePersistenceMapper;
                }
                Object.defineProperty(BaseRemoteService.prototype, "_remoteMapper", {
                    get: function () {
                        return this._mapper;
                    },
                    enumerable: true,
                    configurable: true
                });
                BaseRemoteService.prototype._assignIds = function (items) {
                };
                BaseRemoteService.prototype._load = function (id, options) {
                    var _this = this;
                    var completion$ = new ReplaySubject_2.ReplaySubject(1);
                    this._remoteMapper.load(id, options).subscribe(function (item) {
                        utilities_3.mergeCollection(_this._dataStore.collection, [item]);
                        _this._recordHistory('LOAD');
                        completion$.next(utilities_3.clone(item));
                        completion$.complete();
                        _this._collection$.next(_this._dataStore.collection);
                    }, function (error) { _this._errors$.next(error); completion$.error(error); });
                    return completion$;
                };
                BaseRemoteService.prototype._loadMany = function (isLoadAll, options) {
                    var _this = this;
                    var completion$ = new ReplaySubject_2.ReplaySubject(1);
                    this._remoteMapper.loadMany(options).subscribe(function (items) {
                        utilities_3.mergeCollection(_this._dataStore.collection, items);
                        if (isLoadAll) {
                            _this._dataStore.collection = _this._dataStore.collection.filter(function (i) { return !!items.find(function (j) { return j.id === i.id; }); });
                        }
                        _this._recordHistory('LOAD_MANY');
                        completion$.next(utilities_3.clone(items));
                        completion$.complete();
                        _this._collection$.next(_this._dataStore.collection);
                    }, function (error) { _this._errors$.next(error); completion$.error(error); });
                    return completion$;
                };
                return BaseRemoteService;
            }(local_service_1.LocalCollectionService));
            exports_6("BaseRemoteService", BaseRemoteService);
            CollectionService = (function (_super) {
                __extends(CollectionService, _super);
                function CollectionService(_remotePersistenceMapper) {
                    _super.call(this, _remotePersistenceMapper);
                }
                CollectionService.prototype.get = function (id, options) {
                    return this._load(id, options);
                };
                CollectionService.prototype.getAll = function (options) {
                    var isLoadAll = !!!options;
                    return this._loadMany(isLoadAll, options);
                };
                return CollectionService;
            }(BaseRemoteService));
            exports_6("CollectionService", CollectionService);
            VSCollectionService = (function (_super) {
                __extends(VSCollectionService, _super);
                function VSCollectionService(_remotePersistenceMapper) {
                    _super.call(this, _remotePersistenceMapper);
                }
                VSCollectionService.prototype.get = function (id) {
                    var _this = this;
                    return new vs_queryable_1.VsQueryable(function (options) { return _this._load(id, options); });
                };
                VSCollectionService.prototype.getAll = function () {
                    var _this = this;
                    return new vs_queryable_1.VsQueryable(function (isLoadAll, options) { return _this._loadMany(isLoadAll, options); });
                };
                return VSCollectionService;
            }(BaseRemoteService));
            exports_6("VSCollectionService", VSCollectionService);
        }
    }
});
System.register("vstack-graph/services/angular-http", [], function(exports_7, context_7) {
    "use strict";
    var __moduleName = context_7 && context_7.id;
    var AngularHttpMapper;
    return {
        setters:[],
        execute: function() {
            AngularHttpMapper = (function () {
                function AngularHttpMapper(_a) {
                    var baseUrl = _a.baseUrl, http = _a.http, options = _a.options;
                    this._baseUrl = baseUrl;
                    this._requestOptionsArgs = options;
                    this._http = http;
                }
                AngularHttpMapper.prototype.create = function (items) {
                    return this._http.post(this._baseUrl + "/bulk", JSON.stringify(items), Object.assign({}, this._requestOptionsArgs)).map(function (res) { return res.json(); });
                };
                AngularHttpMapper.prototype.update = function (items) {
                    return this._http.put(this._baseUrl + "/bulk", JSON.stringify(items), Object.assign({}, this._requestOptionsArgs)).map(function (res) { return res.json(); });
                };
                AngularHttpMapper.prototype.delete = function (ids) {
                    return this._http.delete(this._baseUrl + "?ids=" + ids.join(), Object.assign({}, this._requestOptionsArgs)).map(function (res) { return res.status; });
                };
                AngularHttpMapper.prototype.load = function (id, options) {
                    if (options === void 0) { options = ''; }
                    return this._http.get(this._baseUrl + "/" + id, Object.assign({}, this._requestOptionsArgs, options)).map(function (res) { return res.json(); });
                };
                AngularHttpMapper.prototype.loadMany = function (options) {
                    if (options === void 0) { options = ''; }
                    return this._http.get(this._baseUrl, Object.assign({}, this._requestOptionsArgs, options)).map(function (res) { return res.json(); });
                };
                return AngularHttpMapper;
            }());
            exports_7("AngularHttpMapper", AngularHttpMapper);
        }
    }
});
System.register("vstack-graph", ["vstack-graph/graph/base-graph.service", "vstack-graph/graph/graph-utilities", "vstack-graph/services/remote.service", "vstack-graph/services/local.service", "vstack-graph/services/angular-http"], function(exports_8, context_8) {
    "use strict";
    var __moduleName = context_8 && context_8.id;
    var base_graph_service_1, graph_utilities_1, remote_service_1, local_service_2, angular_http_1;
    return {
        setters:[
            function (base_graph_service_1_1) {
                base_graph_service_1 = base_graph_service_1_1;
            },
            function (graph_utilities_1_1) {
                graph_utilities_1 = graph_utilities_1_1;
            },
            function (remote_service_1_1) {
                remote_service_1 = remote_service_1_1;
            },
            function (local_service_2_1) {
                local_service_2 = local_service_2_1;
            },
            function (angular_http_1_1) {
                angular_http_1 = angular_http_1_1;
            }],
        execute: function() {
            exports_8("LocalCollectionService", local_service_2.LocalCollectionService);
            exports_8("CollectionService", remote_service_1.CollectionService);
            exports_8("VSCollectionService", remote_service_1.VSCollectionService);
            exports_8("BaseGraphService", base_graph_service_1.BaseGraphService);
            exports_8("ServiceConfig", graph_utilities_1.ServiceConfig);
            exports_8("Relation", graph_utilities_1.Relation);
            exports_8("AngularHttpMapper", angular_http_1.AngularHttpMapper);
        }
    }
});
//# sourceMappingURL=vstack-graph.js.map