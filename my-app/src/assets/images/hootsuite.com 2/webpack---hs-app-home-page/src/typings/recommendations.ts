/**
 *
 * @export
 * @interface GetRecommendationsResponse
 */
export interface GetRecommendationsResponse {
  /**
   *
   * @type {MetadataPagination}
   * @memberof GetRecommendationsResponse
   */
  metadata: MetadataPagination;
  /**
   * An array of Recommendations
   * @type {Array<RecommendationResponse>}
   * @memberof GetRecommendationsResponse
   */
  recommendations: Array<RecommendationResponse>;
}

/**
 *
 * @export
 * @interface MetadataPagination
 */
export interface MetadataPagination {
  /**
   * Used for pagination
   * @type {string}
   * @memberof MetadataPagination
   */
  cursor?: string;
}

/**
 *
 * @export
 * @interface CallToAction
 */
export interface CallToAction {
  /**
   * Actionable link (how)
   * @type {string}
   * @memberof CallToAction
   */
  description: string;
  /**
   *
   * @type {LinkCallToAction}
   * @memberof CallToAction
   */
  callToActionLink?: LinkCallToAction;
  /**
   *
   * @type {EmitCallToAction}
   * @memberof CallToAction
   */
  callToActionEmit?: EmitCallToAction;
  /**
   * Call to Action: link text
   * @deprecated
   * @type {string}
   * @memberof CallToAction
   */
  linkText?: string;
  /**
   * Call to Action: link url
   * @deprecated
   * @type {string}
   * @memberof CallToAction
   */
  linkUrl?: string;
  /**
   * Type of call to action
   * @type {string}
   * @memberof CallToAction
   */
  type: string;
}

export enum CallToActionType {
  Link = 'LINK',
  Emit = 'EMIT',
}

/**
 *
 * @export
 * @interface LinkCallToAction
 */
export interface LinkCallToAction {
  /**
   *
   * @type {string}
   * @memberof LinkCallToAction
   */
  linkUrl: string;
  /**
   *
   * @type {string}
   * @memberof LinkCallToAction
   */
  linkText: string;
}

/**
 *
 * @export
 * @interface EmitCallToAction
 */
export interface EmitCallToAction {
  /**
   *
   * @type {string}
   * @memberof EmitCallToAction
   */
  emitAction: string;
  /**
   *
   * @type {CallToActionEmitParams}
   * @memberof EmitCallToAction
   */
  emitParams: CallToActionEmitParams;
  /**
   *
   * @type {string}
   * @memberof EmitCallToAction
   */
  emitText: string;
}
/**
 *
 * @export
 * @interface CallToActionEmitParams
 */
export interface CallToActionEmitParams {
  /**
   *
   * @type {string | number}
   * @memberof CallToActionEmitParams
   */
  [key: string]: string | number;
}

/**
 *
 * @export
 * @interface RecommendationResponse
 */
export interface RecommendationResponse {
  /**
   *
   * @type {CallToAction}
   * @memberof RecommendationResponse
   */
  callToAction: CallToAction;
  /**
   * Textual explanation of the Call to Action (why)
   * @type {string}
   * @memberof RecommendationResponse
   */
  insight: string;
  /**
   * Textual explanation of the Call to Action (what)
   * @type {string}
   * @memberof RecommendationResponse
   */
  message: string;
  /**
   * 	A rendered recommendation definition: the actual recommendation
   * @type {string}
   * @memberof RecommendationResponse
   */
  description: string;
  /**
   * Indicates if feedback buttons (thumbs up, thumbs down) should be shown.
   * @type {boolean}
   * @memberof RecommendationResponse
   */
  askForFeedback: boolean;

  /**
   * ID of the recommendation's definition
   */
  definitionId: string;
}
