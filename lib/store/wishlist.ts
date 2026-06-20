"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface WishlistItem {
  productId: string;
  name: string;
  slug: string;
  imageUrl: string;
  priceCents: number;
  specs: string;
}

export interface WishlistState {
  items: WishlistItem[];
  addItem: (item: WishlistItem) => void;
  removeItem: (productId: string) => void;
  toggleItem: (item: WishlistItem) => void;
  isWishlisted: (productId: string) => boolean;
  clearWishlist: () => void;
  getItemCount: () => number;
}

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const existing = get().items.find((i) => i.productId === item.productId);
        if (!existing) {
          set({ items: [...get().items, item] });
        }
      },

      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.productId !== productId) });
      },

      toggleItem: (item) => {
        const existing = get().items.find((i) => i.productId === item.productId);
        if (existing) {
          get().removeItem(item.productId);
        } else {
          get().addItem(item);
        }
      },

      isWishlisted: (productId) => {
        return get().items.some((i) => i.productId === productId);
      },

      clearWishlist: () => set({ items: [] }),

      getItemCount: () => get().items.length,
    }),
    { name: "fusionzone-wishlist" },
  ),
);
