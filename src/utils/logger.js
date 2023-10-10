import winston from 'winston';
import { getConfig } from '../config.js'

const { errorLogFile, httpAccessLogFile, logAllFile, logToConsole  } = getConfig()
/* 
These are the default npm logging levels
that Winston uses, but we include them explicitly
here in case you want to change them
*/
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6
}

// set severity based on NODE_ENV
// development: debug, i.e, log everything
// production: warn and error
const level = () => {
  const env = process.env.NODE_ENV || 'development'
  const isDevelopment = env === 'development'
  return isDevelopment ? 'debug' : 'warn'
}

const format = winston.format.combine(

  // add a timestamp
  winston.format.timestamp(),
  // format all as json
  winston.format.json()
)

/* 
Here we output as defined in the env
*/
const transports = []

  if (logToConsole) { transports.push(new winston.transports.Console())}
  
  if (errorLogFile) { 
    transports.push(new winston.transports.File({
      filename: errorLogFile,
      level: 'error',
    }))
  }

  if (httpAccessLogFile) { 
    transports.push(new winston.transports.File({
      filename: httpAccessLogFile,
      level: 'http',
    }))
  }

  if (logAllFile) {
    transports.push(new winston.transports.File({ 
      filename: logAllFile
    }))
  }

const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
})

export default logger