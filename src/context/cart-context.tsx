"use client";

import type { Product } from "@/data/products";
import React, { createContext, useContext, useReducer, ReactNode, useEffect } from "react";
// -----------------------------------------------------------------------------

// Types
export type CartItem = Product & {
  quantity: number;
};

export type CartState = {
  items: CartItem[];
};

export type CartAction =
  | { type: "ADD_ITEM"; item: Product }
  | { type: "REMOVE_ITEM"; id: number }
  | { type: "UPDATE_QUANTITY"; id: number; quantity: number }
  | { type: "CLEAR_CART" };

const initialState: CartState = {
  items: [],
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.items.find(i => i.id === action.item.id);
      if (existing) {
        return {
          ...state,
          items: state.items.map(i =>
            i.id === action.item.id
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        };
      }
      return { ...state, items: [...state.items, { ...action.item, quantity: 1 }] };
    }
    case "REMOVE_ITEM":
      return { ...state, items: state.items.filter(i => i.id !== action.id) };
    case "UPDATE_QUANTITY":
      return {
        ...state,
        items: state.items.map(i =>
          i.id === action.id ? { ...i, quantity: action.quantity } : i
        ),
      };
    case "CLEAR_CART":
      return { ...state, items: [] };
    default:
      return state;
  }
}

const CartContext = createContext<{
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
} | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Load cart from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("cart-items");
    if (stored) {
      try {
        const items = JSON.parse(stored);
        if (Array.isArray(items)) {
          dispatch({ type: "CLEAR_CART" });
          items.forEach((item: CartItem) => {
            for (let i = 0; i < item.quantity; i++) {
              dispatch({ type: "ADD_ITEM", item });
            }
          });
        }
      } catch {}
    }
  }, []);

  // Persist cart to localStorage on change
  useEffect(() => {
    localStorage.setItem("cart-items", JSON.stringify(state.items));
  }, [state.items]);

  return (
    <CartContext.Provider value={{ state, dispatch }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
