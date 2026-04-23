import {
  utilities as nestWinstonUtilities,
  WinstonModuleOptions,
} from 'nest-winston';
import * as winston from 'winston';

const isProduction = process.env.NODE_ENV === 'production';

export const winstonConfig: WinstonModuleOptions = {
  transports: [
    new winston.transports.Console({
      format: isProduction
        ? winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          )
        : winston.format.combine(
            winston.format.timestamp(),
            nestWinstonUtilities.format.nestLike('API', { prettyPrint: true }),
          ),
    }),
  ],
};
