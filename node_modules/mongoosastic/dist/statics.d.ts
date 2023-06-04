/// <reference types="node" />
import { IndicesCreateRequest, MappingProperty, PropertyName, QueryDslQueryContainer } from '@elastic/elasticsearch/api/types';
import { ApiResponse } from '@elastic/elasticsearch/lib/Transport';
import { EventEmitter } from 'events';
import { FilterQuery } from 'mongoose';
import { MongoosasticDocument, MongoosasticModel, SynchronizeOptions } from './types';
export declare function createMapping(this: MongoosasticModel<MongoosasticDocument>, body: IndicesCreateRequest['body']): Promise<Record<PropertyName, MappingProperty>>;
export declare function synchronize(this: MongoosasticModel<MongoosasticDocument>, query?: FilterQuery<MongoosasticDocument>, inOpts?: SynchronizeOptions): EventEmitter;
export declare function esTruncate(this: MongoosasticModel<MongoosasticDocument>): Promise<void>;
export declare function refresh(this: MongoosasticModel<MongoosasticDocument>): Promise<ApiResponse>;
export declare function esCount(this: MongoosasticModel<MongoosasticDocument>, query: QueryDslQueryContainer): Promise<ApiResponse>;
