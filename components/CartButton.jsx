"use client";

import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import React from 'react';

const CartButton = () => {
    const { totalItems } = useCart();

    return (
        <Link
            href="/checkout"
            aria-label="View shopping cart"
            className="relative flex items-center space-x-2 h-10 px-3.5 sm:px-4 rounded-theme-md bg-themePrimary hover:bg-themePrimary-hover text-white text-xs sm:text-sm font-semibold shadow-sm transition-all active:scale-95"
        >
            <div className="relative flex items-center justify-center">
                <svg className="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                </svg>

                {/* Badge indicator when items exist */}
                {totalItems > 0 && (
                    <span
                        key={totalItems}
                        className="absolute -top-4 -right-0 sm:-right-2 flex items-center justify-center min-w-[1.2rem] h-[1.2rem] px-1 text-[10px] font-black leading-none text-white bg-themeBadge-discount rounded-full ring-2 ring-white shadow-sm animate-scale-in"
                    >
                        {totalItems > 99 ? '99+' : totalItems}
                    </span>
                )}
            </div>

            <span className="hidden sm:inline">Cart</span>
        </Link>
    );
};

export default CartButton;