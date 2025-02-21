import { HttpStatus } from '@nestjs/common';
import { RequestQueryBuilder } from '@dataui/crud-request';
import { isString, objKeys } from '@dataui/crud-util';
import { MergedCrudOptions, ParamsOptions } from '../interfaces';
import { BaseRouteName } from '../types';
import { safeRequire } from '../util';
import { R } from './reflection.helper';
import { SwaggerModels } from '.';
const pluralize = require('pluralize');

export const swagger = safeRequire('@nestjs/swagger', () => require('@nestjs/swagger'));
export const swaggerConst = safeRequire('@nestjs/swagger/dist/constants', () =>
  require('@nestjs/swagger/dist/constants'),
);
export const swaggerPkgJson = safeRequire('@nestjs/swagger/package.json', () =>
  require('@nestjs/swagger/package.json'),
);

export class Swagger {
  /**
   * an object of the operations summaries
   * @param modelName
   * @returns
   */
  static operationsMap(modelName): { [key in BaseRouteName]: string } {
    return {
      getManyBase: `Retrieve multiple ${pluralize(modelName)}`,
      getOneBase: `Retrieve a single ${modelName}`,
      createManyBase: `Create multiple ${pluralize(modelName)}`,
      createOneBase: `Create a single ${modelName}`,
      updateOneBase: `Update a single ${modelName}`,
      replaceOneBase: `Replace a single ${modelName}`,
      deleteOneBase: `Delete a single ${modelName}`,
      recoverOneBase: `Recover one ${modelName}`,
    };
  }

  static setOperation(metadata: any, func: Function) {
    /* istanbul ignore else */
    if (swaggerConst) {
      R.set(swaggerConst.DECORATORS.API_OPERATION, metadata, func);
    }
  }

  static setParams(metadata: any, func: Function) {
    /* istanbul ignore else */
    if (swaggerConst) {
      R.set(swaggerConst.DECORATORS.API_PARAMETERS, metadata, func);
    }
  }

  /**
   * add swaggerModels to swaggerModels.get
   * see `setResponseModels()` for an example of swagger models
   *
   * @param swaggerModels models to be added
   */
  static setExtraModels(swaggerModels: SwaggerModels) {
    /* istanbul ignore else */
    if (swaggerConst) {
      // existing models array
      const meta = Swagger.getExtraModels(swaggerModels.get);
      const models: any[] = [
        ...meta,
        ...objKeys(swaggerModels)
          // values
          // todo: use Object.values(swaggerModels)
          .map((name) => swaggerModels[name])
          .filter((one) => one && one.name !== swaggerModels.get.name),
      ];
      R.set(swaggerConst.DECORATORS.API_EXTRA_MODELS, models, swaggerModels.get);
    }
  }

  static setResponseOk(metadata: any, func: Function) {
    /* istanbul ignore else */
    if (swaggerConst) {
      R.set(swaggerConst.DECORATORS.API_RESPONSE, metadata, func);
    }
  }

  static getOperation(func: Function): any {
    /* istanbul ignore next */
    return swaggerConst ? R.get(swaggerConst.DECORATORS.API_OPERATION, func) || {} : {};
  }

  static getParams(func: Function): any[] {
    /* istanbul ignore next */
    return swaggerConst ? R.get(swaggerConst.DECORATORS.API_PARAMETERS, func) || [] : [];
  }

  static getExtraModels(target: any): any[] {
    /* istanbul ignore next */
    return swaggerConst
      ? R.get(swaggerConst.DECORATORS.API_EXTRA_MODELS, target) || []
      : [];
  }

  static getResponseOk(func: Function): any {
    /* istanbul ignore next */
    return swaggerConst ? R.get(swaggerConst.DECORATORS.API_RESPONSE, func) || {} : {};
  }

  static createResponseMeta(
    name: BaseRouteName,
    options: MergedCrudOptions,
    swaggerModels: any,
  ): any {
    /* istanbul ignore else */
    if (swagger) {
      const { routes, query } = options;
      const oldVersion = Swagger.getSwaggerVersion() < 4;

      switch (name) {
        case 'getOneBase':
          return {
            [HttpStatus.OK]: {
              description: 'Get one base response',
              type: swaggerModels.get,
            },
          };
        case 'getManyBase':
          /* istanbul ignore if */
          if (oldVersion) {
            return {
              [HttpStatus.OK]: {
                type: swaggerModels.getMany,
              },
            };
          }

          return {
            [HttpStatus.OK]: query.alwaysPaginate
              ? {
                  description: 'Get paginated response',
                  type: swaggerModels.getMany,
                }
              : {
                  description: 'Get many base response',
                  schema: {
                    oneOf: [
                      { $ref: swagger.getSchemaPath(swaggerModels.getMany.name) },
                      {
                        type: 'array',
                        items: { $ref: swagger.getSchemaPath(swaggerModels.get.name) },
                      },
                    ],
                  },
                },
          };
        case 'createOneBase':
          /* istanbul ignore if */
          if (oldVersion) {
            return {
              [HttpStatus.OK]: {
                type: swaggerModels.create,
              },
            };
          }

          return {
            [HttpStatus.CREATED]: {
              description: 'Get create one base response',
              schema: { $ref: swagger.getSchemaPath(swaggerModels.create.name) },
            },
          };
        case 'createManyBase':
          /* istanbul ignore if */
          if (oldVersion) {
            return {
              [HttpStatus.OK]: {
                type: swaggerModels.create,
                isArray: true,
              },
            };
          }

          return {
            [HttpStatus.CREATED]: swaggerModels.createMany
              ? /* istanbul ignore next */ {
                  description: 'Get create many base response',
                  schema: { $ref: swagger.getSchemaPath(swaggerModels.createMany.name) },
                }
              : {
                  description: 'Get create many base response',
                  schema: {
                    type: 'array',
                    items: { $ref: swagger.getSchemaPath(swaggerModels.create.name) },
                  },
                },
          };
        case 'deleteOneBase':
          /* istanbul ignore if */
          if (oldVersion) {
            return {
              [HttpStatus.OK]: routes.deleteOneBase.returnDeleted
                ? {
                    type: swaggerModels.delete,
                  }
                : {},
            };
          }
          return {
            [HttpStatus.OK]: routes.deleteOneBase.returnDeleted
              ? {
                  description: 'Delete one base response',
                  schema: { $ref: swagger.getSchemaPath(swaggerModels.delete.name) },
                }
              : {
                  description: 'Delete one base response',
                },
          };
        case 'recoverOneBase':
          /* istanbul ignore if */
          if (oldVersion) {
            return {
              [HttpStatus.OK]: routes.recoverOneBase.returnRecovered
                ? {
                    type: swaggerModels.delete,
                  }
                : {},
            };
          }
          return {
            [HttpStatus.OK]: routes.recoverOneBase.returnRecovered
              ? {
                  description: 'Recover one base response',
                  schema: { $ref: swagger.getSchemaPath(swaggerModels.recover.name) },
                }
              : {
                  description: 'Recover one base response',
                },
          };
        default:
          const dto = swaggerModels[name.split('OneBase')[0]];

          /* istanbul ignore if */
          if (oldVersion) {
            return {
              [HttpStatus.OK]: {
                type: dto,
              },
            };
          }

          return {
            [HttpStatus.OK]: {
              description: 'Response',
              schema: { $ref: swagger.getSchemaPath(dto.name) },
            },
          };
      }
    } else {
      return {};
    }
  }

  /**
   * add metadata for Swagger's docs for path params, such as `users/:userId/posts/:postId` -> ['userId', 'postId']
   * i.e. @ApiParam({name: "id", ...})
   * @param options
   * @returns
   */
  static createPathParamsMeta(options: ParamsOptions): any[] {
    return swaggerConst
      ? objKeys(options).map((param) => ({
          name: param,
          required: true,
          in: 'path',
          type: options[param].type === 'number' ? Number : String,
          enum: options[param].enum ? Object.values(options[param].enum) : undefined,
        }))
      : /* istanbul ignore next */ [];
  }

  /**
   * generate metadata for Swagger's \@ApiQuery()
   * @param name
   * @param options
   * @returns
   */
  static createQueryParamsMeta(name: BaseRouteName, options: MergedCrudOptions) {
    /* istanbul ignore if */
    if (!swaggerConst) {
      return [];
    }

    // the default queryBuilder options
    const {
      delim: d,
      delimStr: coma,
      fields,
      search,
      filter,
      or,
      join,
      sort,
      limit,
      offset,
      page,
      cache,
      includeDeleted,
    } = Swagger.getQueryParamsNames();
    const oldVersion = Swagger.getSwaggerVersion() < 4;
    const docsLink = (a: string) =>
      `<a href="https://github.com/nestjsx/crud/wiki/Requests#${a}" target="_blank">Docs</a>`;

    // Swagger docs for `?fields=`
    const fieldsMetaBase = {
      name: fields,
      description: `Selects resource fields. ${docsLink('select')}`,
      required: false,
      in: 'query',
    };
    const fieldsMeta = oldVersion
      ? /* istanbul ignore next */ {
          ...fieldsMetaBase,
          type: 'array',
          items: {
            type: 'string',
          },
          collectionFormat: 'csv',
        }
      : {
          ...fieldsMetaBase,
          schema: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
          style: 'form',
          explode: false,
        };

    // Swagger docs for `?search=`
    const searchMetaBase = {
      name: search,
      description: `Adds search condition. ${docsLink('search')}`,
      required: false,
      in: 'query',
    };
    const searchMeta = oldVersion
      ? /* istanbul ignore next */ { ...searchMetaBase, type: 'string' }
      : { ...searchMetaBase, schema: { type: 'string' } };

    // Swagger docs for `?filter=`
    const filterMetaBase = {
      name: filter,
      description: `Adds filter condition. ${docsLink('filter')}`,
      required: false,
      in: 'query',
    };
    const filterMeta = oldVersion
      ? /* istanbul ignore next */ {
          ...filterMetaBase,
          items: {
            type: 'string',
          },
          type: 'array',
          collectionFormat: 'multi',
        }
      : {
          ...filterMetaBase,
          schema: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
          style: 'form',
          explode: true,
        };

    // Swagger docs for `?or=`
    const orMetaBase = {
      name: or,
      description: `Adds OR condition. ${docsLink('or')}`,
      required: false,
      in: 'query',
    };
    const orMeta = oldVersion
      ? /* istanbul ignore next */ {
          ...orMetaBase,
          items: {
            type: 'string',
          },
          type: 'array',
          collectionFormat: 'multi',
        }
      : {
          ...orMetaBase,
          schema: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
          style: 'form',
          explode: true,
        };

    // Swagger docs for `?sort=`
    const sortMetaBase = {
      name: sort,
      description: `Adds sort by field. ${docsLink('sort')}`,
      required: false,
      in: 'query',
    };
    const sortMeta = oldVersion
      ? /* istanbul ignore next */ {
          ...sortMetaBase,
          items: {
            type: 'string',
          },
          type: 'array',
          collectionFormat: 'multi',
        }
      : {
          ...sortMetaBase,
          schema: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
          style: 'form',
          explode: true,
        };

    // Swagger docs for `?join=`
    const joinMetaBase = {
      name: join,
      description: `Adds relational resources. ${docsLink('join')}`,
      required: false,
      in: 'query',
    };
    const joinMeta = oldVersion
      ? /* istanbul ignore next */ {
          ...joinMetaBase,
          items: {
            type: 'string',
          },
          type: 'array',
          collectionFormat: 'multi',
        }
      : {
          ...joinMetaBase,
          schema: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
          style: 'form',
          explode: true,
        };

    // Swagger docs for `?limit=`
    const limitMetaBase = {
      name: limit,
      description: `Limit amount of resources. ${docsLink('limit')}`,
      required: false,
      in: 'query',
    };
    const limitMeta = oldVersion
      ? /* istanbul ignore next */ { ...limitMetaBase, type: 'integer' }
      : { ...limitMetaBase, schema: { type: 'integer' } };

    // Swagger docs for `?offset=`
    const offsetMetaBase = {
      name: offset,
      description: `Offset amount of resources. ${docsLink('offset')}`,
      required: false,
      in: 'query',
    };
    const offsetMeta = oldVersion
      ? /* istanbul ignore next */ { ...offsetMetaBase, type: 'integer' }
      : { ...offsetMetaBase, schema: { type: 'integer' } };

    // Swagger docs for `?page=`
    const pageMetaBase = {
      name: page,
      description: `Page portion of resources. ${docsLink('page')}`,
      required: false,
      in: 'query',
    };
    const pageMeta = oldVersion
      ? /* istanbul ignore next */ { ...pageMetaBase, type: 'integer' }
      : { ...pageMetaBase, schema: { type: 'integer' } };

    // Swagger docs for `?cache=`
    const cacheMetaBase = {
      name: cache,
      description: `Reset cache (if was enabled). ${docsLink('cache')}`,
      required: false,
      in: 'query',
    };
    const cacheMeta = oldVersion
      ? /* istanbul ignore next */ {
          ...cacheMetaBase,
          type: 'integer',
          minimum: 0,
          maximum: 1,
        }
      : { ...cacheMetaBase, schema: { type: 'integer', minimum: 0, maximum: 1 } };

    // Swagger docs for `?include_deleted=`
    const includeDeletedMetaBase = {
      name: includeDeleted,
      description: `Include deleted. ${docsLink('includeDeleted')}`,
      required: false,
      in: 'query',
    };
    const includeDeletedMeta = oldVersion
      ? /* istanbul ignore next */ {
          ...includeDeletedMetaBase,
          type: 'integer',
          minimum: 0,
          maximum: 1,
        }
      : {
          ...includeDeletedMetaBase,
          schema: { type: 'integer', minimum: 0, maximum: 1 },
        };

    switch (name) {
      case 'getManyBase':
        return options.query.softDelete
          ? [
              fieldsMeta,
              searchMeta,
              filterMeta,
              orMeta,
              sortMeta,
              joinMeta,
              limitMeta,
              offsetMeta,
              pageMeta,
              cacheMeta,
              includeDeletedMeta,
            ]
          : [
              fieldsMeta,
              searchMeta,
              filterMeta,
              orMeta,
              sortMeta,
              joinMeta,
              limitMeta,
              offsetMeta,
              pageMeta,
              cacheMeta,
            ];
      case 'getOneBase':
        return options.query.softDelete
          ? [fieldsMeta, joinMeta, cacheMeta, includeDeletedMeta]
          : [fieldsMeta, joinMeta, cacheMeta];
      default:
        return [];
    }
  }

  /**
   * get the query param names from queryBuilder options
   * for example the query param `?fields=` can be `fields` or `select`
   * @returns
   */
  static getQueryParamsNames() {
    const qbOptions = RequestQueryBuilder.getOptions();

    // get the default name for the query param
    const name = (n) => {
      const selected = qbOptions.paramNamesMap[n];
      return isString(selected) ? selected : selected[0];
    };

    return {
      delim: qbOptions.delim,
      delimStr: qbOptions.delimStr,
      fields: name('fields'),
      search: name('search'),
      filter: name('filter'),
      or: name('or'),
      join: name('join'),
      sort: name('sort'),
      limit: name('limit'),
      offset: name('offset'),
      page: name('page'),
      cache: name('cache'),
      includeDeleted: name('includeDeleted'),
    };
  }

  private static getSwaggerVersion(): number {
    return swaggerPkgJson
      ? parseInt(swaggerPkgJson.version.split('.')[0], 10)
      : /* istanbul ignore next */ 3;
  }
}

// tslint:disable-next-line:ban-types
export function ApiProperty(options?: any): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    /* istanbul ignore else */
    if (swagger) {
      // tslint:disable-next-line
      const ApiPropertyDecorator =
        swagger.ApiProperty || /* istanbul ignore next */ swagger.ApiModelProperty;
      // tslint:disable-next-line
      ApiPropertyDecorator(options)(target, propertyKey);
    }
  };
}
