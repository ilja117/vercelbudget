// Стилі Tailwind збираються заздалегідь у public/tw.css: npm run css (після нових класів у index.html). npm test перевіряє, що файл свіжий.
module.exports = { darkMode: 'class', content: [__dirname + '/public/index.html'], theme: { extend: { colors: { brand: { 50: '#fdf2f8', 100: '#fce7f3', 500: '#ec4899', 600: '#db2777', 700: '#be185d' } } } } };
