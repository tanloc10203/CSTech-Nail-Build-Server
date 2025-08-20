@echo off
:: Starting the NestJS service managed by PM2
pm2 restart nail-service-container
echo The NestJS service has been restarted.
pause