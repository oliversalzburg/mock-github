import { DataMatcher, DataMatcherMap, RequestBodyMatcher } from "nock/types";
import { EndpointDetails, Params } from "@mg/endpoint-mocker/endpoint-mocker.types";
import { MockAgent } from "undici";

export abstract class RequestMocker {
  private _agent: MockAgent;
  private _endpointDetails: EndpointDetails;
  private _baseUrl: string;

  constructor(agent: MockAgent, baseUrl: string, endpointDetails: EndpointDetails) {
    this._agent = agent;
    this._endpointDetails = endpointDetails;
    this._baseUrl = baseUrl;
  }

  get agent() {
    return this._agent;
  }

  get baseUrl() {
    return this._baseUrl;
  }

  get endpointDetails() {
    return this._endpointDetails;
  }

  protected parseParams(params?: Params) {
    const { pathParams, query, requestBody } = this.extractParams(params);

    let path: string | RegExp = this.endpointDetails.path;
    let regexFlag = false;

    // replace any path variables with either values or regex expression
    for (const match of this.endpointDetails.path.match(/{[^{}]+}/g) ??
      []) {
      let replacementParam;
      if (pathParams[match.slice(1, -1)]) {
        const value = pathParams[match.slice(1, -1)];
        replacementParam = value instanceof RegExp ? value.source : `${value}`;
        regexFlag ||= value instanceof RegExp;
      } else {
        replacementParam = ".+";
        regexFlag = true;
      }
      path = path.replace(new RegExp(match), replacementParam);
    }

    // if a regex expression was encountered then path is used as a regex expression
    if (regexFlag) {
      path = new RegExp(path);
    }

    return { path, query, requestBody };
  }

  private extractParams(params?: Params) {
    const pathParams: Record<string, unknown> = {};
    let query: DataMatcherMap | undefined = undefined;
    let requestBody: RequestBodyMatcher | undefined = undefined;
    if (!params) {
      return { pathParams, query, requestBody };
    }

    // separate out the path, query and body params
    for (const [param, value] of Object.entries(params)) {
      if (this.endpointDetails.parameters.path.includes(param)) {
        pathParams[param] = value;
      }

      if (this.endpointDetails.parameters.query.includes(param)) {
        if (!query) {
          query = {};
        }
        query[param] = value as DataMatcher;
      }

      if (this.endpointDetails.parameters.body.includes(param)) {
        if (!requestBody) {
          requestBody = {};
        }
        requestBody[param] = value as DataMatcher;
      }
    }

    return { pathParams, query, requestBody };
  }
}
