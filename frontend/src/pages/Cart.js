import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { Button } from '../components/ui/button';
import { Trash2, Plus, Minus, ShoppingCart, ArrowLeft } from 'lucide-react';

const Cart = () => {
  const { cartItems, cartRestaurant, updateQuantity, removeFromCart, clearCart, cartTotal } = useCart();
  const navigate = useNavigate();

  if (cartItems.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4" data-testid="empty-cart">
        <img
          src="https://static.prod-images.emergentagent.com/jobs/d81d7df0-2199-4d49-83c7-9882eb41f4a9/images/733b2ed47afd50d90ab55f20895f67fff35045ac833601662c30a886b1ab42a3.png"
          alt="Empty cart"
          className="w-48 h-48 object-contain mb-6 opacity-80"
        />
        <h2 className="text-2xl font-heading font-semibold mb-2">Your cart is empty</h2>
        <p className="text-muted-foreground mb-6">Add some delicious food to get started</p>
        <Button className="rounded-full" onClick={() => navigate('/')} data-testid="browse-restaurants-button">
          Browse Restaurants
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8" data-testid="cart-page">
      <div className="flex items-center gap-3 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full" data-testid="back-from-cart">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-semibold">Your Cart</h1>
          {cartRestaurant && (
            <p className="text-sm text-muted-foreground">From {cartRestaurant.name}</p>
          )}
        </div>
      </div>

      <div className="space-y-4 mb-8">
        {cartItems.map(item => (
          <div
            key={item._id}
            className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-white"
            data-testid={`cart-item-${item._id}`}
          >
            <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
              <img
                src={item.image?.url || 'https://images.unsplash.com/photo-1617686578451-46fa5f114c9d?w=200&h=200&fit=crop'}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h3 className="font-heading font-medium">{item.name}</h3>
              <p className="text-sm text-muted-foreground">&#8377;{item.price} each</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8 rounded-full"
                onClick={() => updateQuantity(item._id, item.quantity - 1)}
                data-testid={`cart-decrease-${item._id}`}
              >
                <Minus className="w-3 h-3" />
              </Button>
              <span className="font-medium w-8 text-center" data-testid={`cart-quantity-${item._id}`}>{item.quantity}</span>
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8 rounded-full"
                onClick={() => updateQuantity(item._id, item.quantity + 1)}
                data-testid={`cart-increase-${item._id}`}
              >
                <Plus className="w-3 h-3" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={() => removeFromCart(item._id)}
                data-testid={`cart-remove-${item._id}`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <div className="font-semibold w-20 text-right">
              &#8377;{item.price * item.quantity}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-white rounded-2xl p-6 border border-border/50" data-testid="cart-summary">
        <h3 className="font-heading font-medium mb-4">Order Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>&#8377;{cartTotal}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Delivery Fee</span>
            <span className="text-green-600">Free</span>
          </div>
          <div className="border-t border-border pt-2 flex justify-between font-semibold text-base">
            <span>Total</span>
            <span data-testid="cart-total">&#8377;{cartTotal}</span>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <Button variant="outline" className="rounded-full" onClick={clearCart} data-testid="clear-cart-button">
            Clear Cart
          </Button>
          <Button className="flex-1 rounded-full" onClick={() => navigate('/checkout')} data-testid="checkout-button">
            Proceed to Checkout
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
