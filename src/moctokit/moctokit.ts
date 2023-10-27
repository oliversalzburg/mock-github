import diagnosticsChannel from "diagnostics_channel";
import { EndpointMocker } from "@mg/endpoint-mocker/abstract-endpoint-mocker";
import endpointToMethod from "@mg/moctokit/generated/endpoint-request";

export class Moctokit extends EndpointMocker {
  private _rest;
  constructor(baseUrl?: string, allowUnmocked = false) {
    super(allowUnmocked);
    this._rest = endpointToMethod(this.agent, baseUrl ?? "https://api.github.com");
  }

  get rest() {
    return this._rest;
  }
}
