const amountFormatter = (amount) => {
  return amount == 0 || !amount
    ? "0.00"
    : amount?.toString()?.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export default amountFormatter;
