export type AccessFormScope = "email" | "mac" | "hrms" | "lab" | "combined";

export type AccessFormFieldType =
  | "text"
  | "textarea"
  | "select"
  | "multiselect"
  | "date"
  | "checkbox"
  | "radio";

export interface AccessFormOption {
  value: string;
  label: string;
}

export interface AccessFormVisibilityRule {
  field: string;
  equals: string | boolean;
}

export interface AccessFormField {
  key: string;
  label: string;
  type: AccessFormFieldType;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  options?: AccessFormOption[];
  visibleWhen?: AccessFormVisibilityRule;
}

export interface AccessFormConfig {
  scope?: AccessFormScope;
  maxDevices?: number;
  fields: AccessFormField[];
}
