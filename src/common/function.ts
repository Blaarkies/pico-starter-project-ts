export function overrideDefaults<T>(
  defaultConfig: T,
  overrideConfig: Partial<T>,
): T {
  let config = Object.assign(defaultConfig, overrideConfig);

  return config;
}