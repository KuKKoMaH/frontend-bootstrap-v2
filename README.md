# Запуск
- Дев + вотчеры: `npm run dev`
- Продакшн: `npm run production`

## HTML
Для генерации страницы нужно добавить в `dist/pages` директорию с 
названием страницы. При добавлении модуля через `include`, в сборку 
будут добавлены стили и скрипты, из директории этого модуля.

## CSS
Для получения названия сгенерированного класса внутри JS необходимо
импортировать модуль `src/js/styles.js`.

### Сетка
Сетка основана на инлайновых блоках. Контейнер создается классом `.w`.
Колонки - комбинацией классов `.c` и `.c{1-12}`, где `.c` служит для задания
базовых стилей колонки и `.c{1-12}` для задания нужной ширины.

### Изображения
Пути до изображений должны быть заданы относительно `src`.

Все изображения, используемые в шаблонах и стилях, автоматически 
переносятся в `dist/img`. 

Изображения, имена которых начинаются с `sprite-`, объединяются в спрайт
и переносятся в директорию с изображениями.

#### TODO
- Допилить вотчеры
- Сделать консольную утилиту

#### Плагины
- stylus(http://stylus-lang.com/)
- postcss(https://github.com/postcss/postcss)
    - css-modules(https://github.com/css-modules/postcss-modules)
    - postcss-import(https://github.com/postcss/postcss-import)
    - cssnano(http://cssnano.co/)
    - postcss-cssnext(https://github.com/MoOx/postcss-cssnext)
    - postcss-image-sizes(https://github.com/s0ber/postcss-image-sizes)
    - postcss-sprites(https://github.com/2createStudio/postcss-sprites)
    - postcss-copy(https://github.com/geut/postcss-copy)
    - css-mqpacker(https://github.com/hail2u/node-css-mqpacker)
- pug(https://github.com/pugjs/pug)
- posthtml(https://github.com/posthtml/posthtml)
- imagemin(https://github.com/imagemin/imagemin)
    - imagemin-mozjpeg(https://github.com/imagemin/imagemin-mozjpeg)
    - imagemin-pngquant(https://github.com/imagemin/imagemin-pngquant)
- webpack(https://webpack.github.io)
- livereload(https://github.com/napcs/node-livereload)

#### JS штуки
- jQuery
- Magnific Popup(http://dimsemenov.com/plugins/magnific-popup/)
- Slick(http://kenwheeler.github.io/slick/)
- Lazyload(https://github.com/verlok/lazyload)
- jquery.maskedinput(https://github.com/digitalBush/jquery.maskedinput)