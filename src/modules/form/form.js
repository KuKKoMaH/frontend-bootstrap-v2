// import 'jquery.maskedinput/src/jquery.maskedinput.js';
// import styles from '../../js/styles';
// import Validator from '../../js/Validator';
//
// const $block = $('.' + styles.form.block);
//
// const fieldNames = [
//   { name: 'name', type: 'string', required: true },
//   { name: 'email', type: 'email'},
//   { name: 'phone', type: 'phone', required: true },
//   { name: 'message', type: 'string' },
// ];
//
// const fields = fieldNames.map((field) => {
//   const $input = $block.find('[name="' + field.name + '"]');
//   const $wrapper = $input.parent();
//   return {
//     wrapper:  $wrapper,
//     input:    $input,
//     error:    $wrapper.find('.' + styles.form.message),
//     type:     field.type,
//     required: field.required
//   };
// });
//
// new Validator({
//   form:    $block.find('form'),
//   classes: {
//     error: styles.form.error
//   },
//   fields
// });
//
// $block.find('[name="phone"]').mask("+7 (999) 999-99-99");