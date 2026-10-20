export const formHandler = (
  name,
  form,
  refs,
  submit,
  returnKeyType = "next"
) => {
  let keyType = returnKeyType;
  const props = {};
  props.onChangeText = form.handleChange(name);
  props.onBlur = form.handleBlur(name);
  props.value = form.values[name];
  props.error = form.errors[name];

  props.returnKeyType = keyType;
  return props;
};
