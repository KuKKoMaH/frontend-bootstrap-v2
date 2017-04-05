/*global $*/

/**
 * @typedef {object} FormConfig
 * @prop {JQuery} form
 * @prop {Object.<String} classes
 * @prop {Array.<InputConfig>} fields
 */

/**
 * @typedef {object} InputConfig
 * @prop {JQuery} [wrapper]
 * @prop {JQuery} [input]
 * @prop {JQuery} [error]
 * @prop {'string'|'email'|'phone'|'date'|'checkbox|'file'} [type='string']
 * @prop {boolean} [required=false]
 * @prop {'or'} [logic]
 * @prop {Array.<InputConfig>} [fields]
 */

const re_email = /^[a-z0-9!#$%&'*+\/=?^_`{|}~.-]+@[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i;
const re_phone = /\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}/i;
const re_date = /^\d{2}\.\d{2}\.\d{4}$/i;
const allowed_filetypes = ['pdf', 'txt', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'gif'];

export default class Validator {

  static rules = {
    email:    (val, field) => re_email.test(val),
    phone:    (val, field) => re_phone.test(val),
    date:     (val, field) => {
      const d = val.split('.');
      return re_date.test(val) && !isNaN(new Date(d[2] + '-' + d[1] + '-' + d[0]).getTime());
    },
    string:   (val, field) => val.length > 0,
    checkbox: (val, field) => field.input.prop('checked'),
    file:     (val, field) => {
      var files = field.input.prop('files');
      if (files['length']) {
        var file = files[0],
          file_parts = file.name.split('.'),
          file_ext = file_parts[file_parts.length - 1];
        return file.size < 10 * 1024 * 1024 && allowed_filetypes.indexOf(file_ext) !== -1;
      } else return false;
    }
  };

  static messages = {
    required: 'Поле обязательно для заполнения',
    email:    'Введите корректный email',
    phone:    'Введите корректный телефон',
  };

  /**
   *
   * @param {FormConfig} config
   */
  constructor(config) {
    if (!config.form) throw new Error('form must be defined');
    if (!config.fields) throw new Error('fields must be defined');
    this.form = config.form;
    this.fields = config.fields;
    this.classes = config.classes || {};

    this.form.on('submit', this.onSubmitForm.bind(this));
    this.bindEvents(this.fields);
  }

  onSubmitForm(e) {
    e.preventDefault();
    const form = this.form;

    const fieldStates = this.fields.map(field => this.validateField(field, true));
    if (fieldStates.some(state => !state)) return;

    $.ajax({
      url:      form.attr('action'),
      type:     form.attr('method'),
      data:     form.serializeArray(),
      cache:    false,
      dataType: 'json',
      success:  (data) => {
        alert(data.message);
        form[0].reset();
      },
      error:    function () {

      }
    });

    return false;
  }

  /**
   * @param {Array.<InputConfig>} fields
   */
  bindEvents(fields) {
    fields.forEach((field) => {
      field.input.on('input', () => this.validateField(field));
      field.input.on('blur', () => {
        this.validateField(field, true);
      });
    })
  }

  /**
   * Проверяет содержимое поля и выводит сообщение об ошибке в случае провала
   * @param {InputConfig} field
   * @param {boolean} [force=false] - принудительно валидировать
   * @return {boolean} - валидность поля
   */
  validateField(field, force) {
    if (force) field.input.data('touched', true);
    if (!field.input.data('touched')) return true;

    const value = field.input.val().trim();
    let result = this.testField(field, value);

    if (!result.length) {
      field.wrapper.removeClass(this.classes.error);
      field.error.html('');
    } else {
      field.wrapper.addClass(this.classes.error);
      field.error.html(result.map(this.l10n.bind(this)).join(', '));
    }
    return !result.length;
  }

  /**
   * Проверяет указанное поле и озвращает массив ошибок
   * @param {InputConfig} field - поле
   * @param {string} value - значение поля
   * @return {Array.<String>}
   */
  testField(field, value) {
    const rules = this.constructor.rules;
    if (value === '' && field['required']) return ['required'];
    if (rules[field.type] && value) return rules[field.type](value, field) ? [] : [field.type];
    return [];
  }

  l10n(error) {
    return this.constructor.messages[error] || error;
  }
}