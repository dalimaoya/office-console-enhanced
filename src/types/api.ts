export type ApiSuccess<T> = {
  success: true;
  data: T;
  cached?: boolean;
  stale?: boolean;
  warning?: {
    type: string;
    message: string;
  };
};

export type ApiFailure = {
  success: false;
  error: {
    code: string;
    message: string;
    detail?: string;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export type WarningPayload = NonNullable<ApiSuccess<unknown>['warning']>;
