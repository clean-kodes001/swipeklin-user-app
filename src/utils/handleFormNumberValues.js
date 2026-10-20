export const handleFormNumberValues = (onChangeText, text) => {
  const processedText = text.replace(/\D/g, "");

  onChangeText(processedText);
};
