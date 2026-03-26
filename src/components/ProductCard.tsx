import React, { useState } from 'react';
import { Product } from '../types';
import { ShoppingCart, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const [currentImg, setCurrentImg] = useState(0);
  const images = [product.IMG, product.IMG2, product.IMG3]
    .filter(img => img && img.trim() !== '')
    .map(img => img.trim());

  const displayImages = images.length > 0 ? images : ['https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=400&q=80'];

  const nextImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImg((prev) => (prev + 1) % displayImages.length);
  };

  const prevImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImg((prev) => (prev - 1 + displayImages.length) % displayImages.length);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl shadow-lg overflow-hidden flex flex-col h-full border transition-all duration-300",
        product.STOCK > 0 
          ? "bg-white border-orange-50" 
          : "bg-red-50 border-red-100 grayscale-[0.3]"
      )}
    >
      <div className="relative aspect-square overflow-hidden group">
        <AnimatePresence mode="wait">
          <motion.img
            key={displayImages[currentImg]}
            src={displayImages[currentImg]}
            alt={product.PRODUCTO}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=400&q=80';
            }}
          />
        </AnimatePresence>

        {displayImages.length > 1 && (
          <>
            <button
              onClick={prevImg}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 p-1 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="w-5 h-5 text-orange-600" />
            </button>
            <button
              onClick={nextImg}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 p-1 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="w-5 h-5 text-orange-600" />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {displayImages.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all",
                    i === currentImg ? "bg-orange-500 w-3" : "bg-white/60"
                  )}
                />
              ))}
            </div>
          </>
        )}

        {product.OFERTA && product.OFERTA > 0 && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-full shadow-lg z-10">
            {product.OFERTA}% OFF
          </div>
        )}

        {product.STOCK <= 3 && product.STOCK > 0 && (
          <div className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm z-10">
            <AlertCircle className="w-3 h-3" />
            ¡ÚLTIMOS {product.STOCK}!
          </div>
        )}
        {product.STOCK === 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20">
            <span className="bg-white text-gray-800 px-4 py-2 rounded-lg font-bold shadow-lg uppercase tracking-widest">SIN STOCK</span>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-1">
          <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">{product.CATEGORIA}</span>
          <span className="text-xs font-medium text-gray-500">Talle: {product.TALLE}</span>
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-1 line-clamp-1">{product.PRODUCTO}</h3>
        <p className="text-xs text-gray-500 line-clamp-2 mb-3 flex-grow">{product.CARACTERISTICAS}</p>
        
        <div className="flex items-center justify-between mt-auto">
          <div className="flex flex-col">
            {product.OFERTA && product.OFERTA > 0 ? (
              <>
                <span className="text-[10px] text-gray-400 line-through font-bold">
                  ${(product.PRECIO || 0).toLocaleString('es-AR')}
                </span>
                <span className="text-xl font-black text-red-600">
                  ${((product.PRECIO || 0) * (1 - product.OFERTA / 100)).toLocaleString('es-AR')}
                </span>
              </>
            ) : (
              <span className="text-xl font-black text-orange-600">
                ${(product.PRECIO || 0).toLocaleString('es-AR')}
              </span>
            )}
          </div>
          <button
            onClick={() => onAddToCart(product)}
            disabled={product.STOCK === 0}
            className={cn(
              "p-3 rounded-xl transition-all flex items-center gap-2",
              product.STOCK > 0 
                ? "bg-orange-500 text-white hover:bg-orange-600 active:scale-95 shadow-md shadow-orange-200" 
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            )}
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="text-sm font-bold">Agregar</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
