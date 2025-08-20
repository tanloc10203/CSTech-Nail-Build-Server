@echo off
:: Stopping the NestJS service managed by PM2
pm2 stop nail-service-container
echo The NestJS service has been stopped.
pause
