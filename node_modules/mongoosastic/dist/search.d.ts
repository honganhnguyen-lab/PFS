import { ApiResponse } from '@elastic/elasticsearch';
import { QueryDslQueryContainer, SearchRequest, SearchResponse } from '@elastic/elasticsearch/api/types';
import { EsSearchOptions, HydratedSearchResults, MongoosasticDocument, MongoosasticModel } from './types';
export declare function search(this: MongoosasticModel<MongoosasticDocument>, query: QueryDslQueryContainer, opts?: EsSearchOptions): Promise<ApiResponse<SearchResponse, unknown> | ApiResponse<HydratedSearchResults>>;
export declare function esSearch(this: MongoosasticModel<MongoosasticDocument>, query: SearchRequest['body'], opts?: EsSearchOptions): Promise<ApiResponse<SearchResponse, unknown> | ApiResponse<HydratedSearchResults>>;
