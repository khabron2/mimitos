import React, { useState } from 'react';
import { ShoppingCart, Menu, X, PawPrint } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';

interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
  onCategoryFilter: (category: string) => void;
}

export default function Navbar({ cartCount, onOpenCart, onCategoryFilter }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const categories = ['Todos', 'Chalecos', 'Correas', 'Juguetes', 'Accesorios'];

  const handleCategoryClick = (category: string) => {
    onCategoryFilter(category);
    setIsMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-md px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <button onClick={() => setIsMenuOpen(true)} className="p-1 md:hidden">
          <Menu className="w-6 h-6 text-orange-600" />
        </button>
        <Link to="/" className="flex items-center gap-1">
          <PawPrint className="w-8 h-8 text-orange-500" />
          <span className="text-2xl font-bold text-orange-600 font-serif italic">Mimitos</span>
        </Link>
      </div>

      <div className="hidden md:flex items-center gap-6">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onCategoryFilter(cat)}
            className="text-gray-600 hover:text-orange-500 font-medium transition-colors"
          >
            {cat}
          </button>
        ))}
        <Link to="/admin" className="text-sm text-gray-400 hover:text-orange-400">Admin</Link>
      </div>

      <button onClick={onOpenCart} className="relative p-2">
        <ShoppingCart className="w-7 h-7 text-orange-600" />
        {cartCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white"
          >
            {cartCount}
          </motion.span>
        )}
      </button>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-[60]"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-64 bg-white z-[70] p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <span className="text-xl font-bold text-orange-600">Menú</span>
                <button onClick={() => setIsMenuOpen(false)}>
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>
              <div className="flex flex-col gap-4">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleCategoryClick(cat)}
                    className="text-left text-lg text-gray-700 hover:text-orange-500 py-2 border-b border-gray-100"
                  >
                    {cat}
                  </button>
                ))}
                <Link
                  to="/admin"
                  onClick={() => setIsMenuOpen(false)}
                  className="mt-4 text-sm text-gray-400"
                >
                  Administración
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
