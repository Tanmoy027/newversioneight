"use client"

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
} from "react"

const CartContext = createContext(null)

function reducer(state, action) {
  switch (action.type) {
    case "load":
      return action.payload
    case "add":
      // avoid duplicates; increase qty instead
      const idx = state.findIndex((i) => i.id === action.payload.id)
      if (idx !== -1) {
        const next = [...state]
        next[idx].qty += action.payload.qty
        return next
      }
      return [...state, action.payload]
    case "remove":
      return state.filter((item) => item.id !== action.payload)
    case "qty":
      return state.map((i) =>
        i.id === action.payload.id ? { ...i, qty: action.payload.qty } : i,
      )
    case "clear":
      return []
    default:
      return state
  }
}

export function CartProvider({ children }) {
  const [cart, dispatch] = useReducer(reducer, [])

  /* ----------  persist to localStorage  ---------- */
  useEffect(() => {
    const raw = localStorage.getItem("eightHand:cart")
    if (raw) dispatch({ type: "load", payload: JSON.parse(raw) })
  }, [])

  useEffect(() => {
    localStorage.setItem("eightHand:cart", JSON.stringify(cart))
  }, [cart])

  /* ----------  helpers  ---------- */
  const value = {
    cartItems: cart,
    addToCart: (item, qty = 1) =>
      dispatch({ type: "add", payload: { ...item, qty } }),
    removeFromCart: (id) => dispatch({ type: "remove", payload: id }),
    updateQuantity: (id, qty) => dispatch({ type: "qty", payload: { id, qty } }),
    clearCart: () => dispatch({ type: "clear" }),
    cartTotal: cart.reduce((t, i) => t + i.price * i.qty, 0),
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used within a CartProvider")
  return ctx
}
