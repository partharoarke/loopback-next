// Copyright IBM Corp. 2018. All Rights Reserved.
// Node module: @loopback/openapi-v3
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {
  ResponseObject,
  SchemaObject,
  ReferenceObject,
} from '@loopback/openapi-v3-types';
import {
  MetadataInspector,
  ParameterDecoratorFactory,
  MethodDecoratorFactory,
} from '@loopback/context';
import {getSchemaForRequestBody} from '../generate-schema';
import {OAI3Keys} from '../keys';
import * as _ from 'lodash';
import {inspect} from 'util';

const debug = require('debug')('loopback:openapi3:metadata:requestbody');
export const REQUEST_BODY_INDEX = 'x-parameter-index';

/**
 * Describe the request body of a Controller method parameter.
 *
 * A typical OpenAPI response spec contains property
 * `description`, and `content`:
 *
 * ```ts
 * responseSpec: {
 *   description: 'returns a customer instance',
 *   content: {
 *     'application/json': {...schemaSpec},
 *     'application/text': {...schemaSpec},
 *   },
 * }
 * ```
 *
 * If the `content` object is not provided, this decorator sets it
 * as `application/json` by default.
 * If the `schema` object is not provided in a media type, this decorator
 * generates it for you based on the argument's type. In this case, please
 * make sure the argument type is a class decorated by @model from `@loopback/repository`
 *
 * The simplest usage is:
 *
 * ```ts
 * class MyController {
 *   @post('/User')
 *   @response(User)
 *   async create(@requestBody() user: User) {}
 * }
 * ```
 *
 * or with properties other than `content`
 *
 * ```ts
 * class MyController {
 *   @post('/User')
 *   @response({description: ''})
 *   async create(@requestBody({description: 'a user'}) user: User) {}
 * }
 * ```
 *
 * or to be more complicated, with your customized media type
 *
 * ```ts
 * class MyController {
 *   @post('/User')
 *   @response({
 *     description: 'a user',
 *     // leave the schema as empty object, the decorator will generate it.
 *     content: {'application/json': {}}
 *   }
 *   async create(@requestBody({
 *     description: 'a user',
 *     // leave the schema as empty object, the decorator will generate it.
 *     content: {'application/text': {}}
 *   }) user: User) {}
 * }
 * ```
 *
 * @param responseSpec The complete response Object or partial of it.
 * "partial" for allowing no `content` in spec, for example:
 * ```
 * @response({description: 'a request body'}) user: User
 * ```
 */
export function response(responseSpec?: Partial<ResponseObject>) {
  return function(
    target: Object,
    member: string,
    // tslint:disable-next-line:no-any
    descriptor: TypedPropertyDescriptor<any>,
  ) {
    debug('@requestBody() on %s.%s', target.constructor.name, member);
    debug('  options: %s', inspect(responseSpec, {depth: null}));

    // Use 'application/json' as default content if `requestBody` is undefined
    responseSpec = responseSpec || {content: {}};

    if (_.isEmpty(responseSpec.content))
      responseSpec.content = {'application/json': {}};

    /*
    // Get the design time method parameter metadata
    const methodSig = MetadataInspector.getDesignTypeForMethod(target, member);

    debug('  inferred schema: %s', inspect(schema, {depth: null}));
    responseSpec.content = _.mapValues(responseSpec.content, c => {
      if (!c.schema) {
        c.schema = schema;
      }
      return c;
    });
    */

    debug('  final spec: ', inspect(responseSpec, {depth: null}));
    MethodDecoratorFactory.createDecorator<ResponseObject>(
      OAI3Keys.RESPONSE_KEY,
      responseSpec as ResponseObject,
    )(target, member, descriptor);
  };
}

export namespace response {
  /**
   * Define a requestBody of `array` type.
   *
   * @example
   * ```ts
   * export class MyController {
   *   @post('/greet')
   *   @response.array(
   *     {schema: {type: 'string'}},
   *     {description: 'an array of names'}
   *   )
   *   greet(@requestBody.array(
   *     {schema: {type: 'string'}},
   *     {description: 'an array of names', required: false}
   *   ) names: string[]): string {
   *     return names`;
   *   }
   * }
   * ```
   *
   * @param properties The requestBody properties other than `content`
   * @param itemSpec the full item object
   */
  export const array = function(
    itemSpec: SchemaObject | ReferenceObject,
    properties?: {description?: string; required?: boolean},
  ) {
    return response({
      ...properties,
      content: {
        'application/json': {
          schema: {type: 'array', items: itemSpec},
        },
      },
    });
  };
}
