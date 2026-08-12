export interface RedisConnectionConfig {
  connectionString?: string | null;
  hostName?: string | null;
  port?: string | number | null;
  tlsEnabled?: string | boolean | null;
}

const parseRedisTlsEnabled = (
  tlsEnabled: RedisConnectionConfig['tlsEnabled'],
  defaultValue: boolean,
): boolean => {
  if (typeof tlsEnabled === 'boolean') {
    return tlsEnabled;
  }

  if (typeof tlsEnabled === 'string' && tlsEnabled.length > 0) {
    return tlsEnabled === 'true';
  }

  return defaultValue;
};

export const buildRedisConnectionUrl = ({
  connectionString,
  hostName,
  port,
  tlsEnabled,
}: RedisConnectionConfig): string => {
  // When no connection string is provided, build a URL from individual components.
  // This preserves backward-compatibility with environments that only supply
  // REDIS_HOST_NAME / REDIS_PORT / REDIS_TLS_ENABLED (e.g. test environments).
  if (!connectionString) {
    const useTls = parseRedisTlsEnabled(tlsEnabled, false);
    const protocol = useTls ? 'rediss' : 'redis';
    const resolvedHost = hostName || 'localhost';
    const resolvedPort = port ?? (useTls ? 6380 : 6379);
    return `${protocol}://${resolvedHost}:${resolvedPort}`;
  }

  const redisUrl = new URL(connectionString);
  const defaultTlsEnabled = redisUrl.protocol === 'rediss:';
  const useTls = parseRedisTlsEnabled(tlsEnabled, defaultTlsEnabled);

  redisUrl.protocol = useTls ? 'rediss:' : 'redis:';

  if (useTls && hostName) {
    redisUrl.hostname = hostName;
  }

  if (useTls && port) {
    redisUrl.port = String(port);
  }

  return redisUrl.toString();
};