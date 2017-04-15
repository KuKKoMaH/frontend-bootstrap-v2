import styles from '../../js/styles';
import 'slick-carousel';

$('.' + styles.slider.block).slick({
  lazyLoad: 'progressive',
  dots: true,
});
