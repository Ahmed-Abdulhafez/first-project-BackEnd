exports.calcTotalCartPrice = (cart) => {
  cart.totalCartPrice = cart.cartItems.reduce(
    (acc, item) => acc + item.quantity * item.price,
    0
  );
  return cart.totalCartPrice;
};