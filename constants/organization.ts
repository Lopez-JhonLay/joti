export const GENERAL_PROJECT_NAME = 'General / Adhoc';

export function isGeneralProjectName(name: string) {
  return /^general\s*\/\s*adhoc$/i.test(name.trim());
}
