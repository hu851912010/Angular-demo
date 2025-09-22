// scripts/gen-countries-zh.js
const fs = require('fs');
const countries = require('i18n-iso-countries');

countries.registerLocale(require('i18n-iso-countries/langs/zh.json'));
countries.registerLocale(require('i18n-iso-countries/langs/en.json'));

const alpha3List = Object.keys(countries.getAlpha3Codes());

const data = alpha3List.map(alpha3 => {
  const alpha2 = countries.alpha3ToAlpha2(alpha3);
  const name_en = countries.getName(alpha2, 'en') || alpha3;
  const name_cn = countries.getName(alpha2, 'zh') || name_en;
  return { code: alpha3, name_en, name_cn };
}).sort((a, b) => a.name_cn.localeCompare(b.name_cn, 'zh-Hans-CN'));

fs.mkdirSync('./src/assets', { recursive: true });
fs.writeFileSync('./src/assets/country_full_cn.json', JSON.stringify(data, null, 2), 'utf8');

console.log(`✅ Generated ./src/assets/country_full_cn.json (${data.length} entries)`);
