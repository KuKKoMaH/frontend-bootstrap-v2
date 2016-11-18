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

## Изображения
Все изображения, используемые в шаблонах и стилях, автоматически 
переносятся в `dist/img`. 

Изображения, имена которых начинаются с `sprite-`, объединяются в спрайт
и переносятся в директорию с изображениями.

Для упрощения работы есть миксин `sprite($url)`, в который надо передать
относительный путь до изображения. Также доступы миксины 
`image-width($url)` и `image-height($url)`, коотрые возвращают размеры 
изображения.

## TODO
- сжатие картинок
- СВГ + спрайты
- Допилить вотчеры:

### Плагины
- stylus(http://stylus-lang.com/)
- postcss(https://github.com/postcss/postcss)
    - css-modules(https://github.com/css-modules/postcss-modules)
    - postcss-import(https://github.com/postcss/postcss-import)
    - cssnano(http://cssnano.co/)
    - postcss-cssnext(https://github.com/MoOx/postcss-cssnext)
    - postcss-image-sizes(https://github.com/s0ber/postcss-image-sizes)
    - postcss-sprites(https://github.com/2createStudio/postcss-sprites)
    - postcss-copy(https://github.com/geut/postcss-copy)
- pug(https://github.com/pugjs/pug)
- webpack(https://webpack.github.io)

### JS штуки
- jQuery
- Magnific Popup(http://dimsemenov.com/plugins/magnific-popup/)
- Owl Carousel(http://owlcarousel2.github.io/OwlCarousel2/)
- Lazyload(https://github.com/verlok/lazyload)
- jquery.maskedinput(https://github.com/digitalBush/jquery.maskedinput)