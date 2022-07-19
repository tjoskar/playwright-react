#!/bin/bash
echo "> npx playwright install"
npx playwright install
echo "> npx playwright test $1"
npx playwright test $1
