import createError, {HttpError} from 'http-errors';
import express, {NextFunction, Request, Response} from 'express';
import path from 'path';
import cookieParser from "cookie-parser";
import logger from 'morgan';
import indexRouter from './routes/index';
import usersRouter from './routes/users';
import notificationsRouter from './routes/notifications';
import secretsRouter from './routes/secrets';
import helmet from "helmet";
import cors from 'cors';

export const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// cors
app.use(cors());
app.options('*', cors());

app.use(helmet({
    frameguard: { action: 'deny' },
    hsts: false,
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"]
        }
    }
}));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/notifications', notificationsRouter);
app.use('/secrets', secretsRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use((err: HttpError, req: Request, res: Response, next: NextFunction) => {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
});
