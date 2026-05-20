@echo off
echo Start Wie Is Het? Online op je pc...
echo Open daarna: http://localhost:8765
echo.
start http://localhost:8765
npx --yes serve -l 8765 .
