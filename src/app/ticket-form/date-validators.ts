import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// Validator to check if startDate is not older than today
export function startDateValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const startDate = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set time to the start of the day

    return startDate < today ? { 'startDateInvalid': true } : null;
  };
}

// Validator to check if endDate is at least one day after startDate
export function endDateValidator(startDateControl: AbstractControl): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value || !startDateControl.value) {
      return null;
    }

    const endDate = new Date(control.value);
    const startDate = new Date(startDateControl.value);
    startDate.setDate(startDate.getDate() + 1); // Add one day to startDate

    return endDate < startDate ? { 'endDateInvalid': true } : null;
  };
}
