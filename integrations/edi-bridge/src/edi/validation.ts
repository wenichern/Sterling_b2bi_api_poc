export interface ValidationIssue {
  /** Stable machine-readable code (safe to log; contains no payload data). */
  code: string;
  /** JSON pointer into the validated document. */
  path: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

export const issue = (code: string, path: string, message: string): ValidationIssue => ({ code, path, message });
export const ok = (warnings: ValidationIssue[] = []): ValidationResult => ({ valid: true, errors: [], warnings });
export const fail = (errors: ValidationIssue[], warnings: ValidationIssue[] = []): ValidationResult => ({
  valid: false,
  errors,
  warnings,
});

/** ok() when there are no errors, otherwise fail(). */
export const result = (errors: ValidationIssue[], warnings: ValidationIssue[] = []): ValidationResult =>
  errors.length === 0 ? ok(warnings) : fail(errors, warnings);
