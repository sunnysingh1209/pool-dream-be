import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

const isProduction = process.env.NODE_ENV === 'production';

function rotateFileTransport(level: string, filenamePrefix: string) {
  return new winston.transports.DailyRotateFile({
    level,
    dirname: 'logs',
    filename: `${filenamePrefix}-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    // Bounded retention so log files can't fill the disk indefinitely.
    maxFiles: '14d',
    format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  });
}

export const winstonLoggerOptions: winston.LoggerOptions = {
  level: isProduction ? 'info' : 'debug',
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.ms(),
        nestWinstonModuleUtilities.format.nestLike('PoolDream', {
          colors: true,
          prettyPrint: true,
        }),
      ),
    }),
    rotateFileTransport('info', 'application'),
    rotateFileTransport('error', 'error'),
  ],
};
