import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Product, CartItem, AppSettings } from './types';
import { fetchProducts, fetchSettings } from './lib/googleSheets';
import Navbar from './components/Navbar';
import ProductCard from './components/ProductCard';
import Cart from './components/Cart';
import AdminPanel from './components/AdminPanel';
import { motion, AnimatePresence } from 'motion/react';
import { Search, RefreshCw, PawPrint, Heart, Info } from 'lucide-react';

function Shop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<AppSettings>({ shippingPrice: 3000, whatsappNumber: '3834465044' });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('mimitos_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallButton(false);
    }
    setDeferredPrompt(null);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [productsData, settingsData] = await Promise.all([
        fetchProducts(),
        fetchSettings()
      ]);
      setProducts(productsData);
      setSettings(settingsData);
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    localStorage.setItem('mimitos_cart', JSON.stringify(cart));
  }, [cart]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.PRODUCTO.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'Todos' || p.CATEGORIA === selectedCategory;
      const hasStock = p.STOCK > 0;
      return matchesSearch && matchesCategory && hasStock;
    });
  }, [products, searchTerm, selectedCategory]);

  const addToCart = (product: Product) => {
    const existing = cart.find((item) => item.id === product.id);
    if (existing && existing.quantity >= product.STOCK) {
      setToast(`¡No hay más stock de ${product.PRODUCTO}!`);
      setTimeout(() => setToast(null), 2000);
      return;
    }
    if (product.STOCK <= 0) return;

    setCart((prev) => {
      const existingInPrev = prev.find((item) => item.id === product.id);
      if (existingInPrev) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setToast(`¡${product.PRODUCTO} agregado!`);
    setTimeout(() => setToast(null), 2000);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = Math.max(1, Math.min(item.STOCK, item.quantity + delta));
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => setCart([]);

  const updateLocalStock = (id: string, newStock: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, STOCK: newStock } : p))
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-orange-50 flex flex-col items-center justify-center gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <PawPrint className="w-12 h-12 text-orange-500" />
        </motion.div>
        <p className="text-orange-600 font-bold animate-pulse">Cargando Mimitos...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Navbar
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
        onCategoryFilter={setSelectedCategory}
      />

      {showInstallButton && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-orange-600 text-white px-4 py-3 flex items-center justify-between sticky top-16 z-40 shadow-lg"
        >
          <div className="flex items-center gap-3">
            <div className="bg-white p-1.5 rounded-lg shadow-sm">
              <PawPrint className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-black leading-tight">Instala Mimitos</p>
              <p className="text-[10px] font-medium opacity-90">Accede más rápido desde tu pantalla de inicio</p>
            </div>
          </div>
          <button 
            onClick={handleInstallClick}
            className="bg-white text-orange-600 px-4 py-1.5 rounded-full text-xs font-black shadow-sm hover:bg-orange-50 transition-colors"
          >
            INSTALAR
          </button>
        </motion.div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {/* Hero Section */}
        <section className="bg-orange-500 rounded-2xl p-6 text-white relative overflow-hidden shadow-xl shadow-orange-100">
          <div className="relative z-10 max-w-lg">
            <h2 className="text-3xl font-black mb-2 leading-tight">¡Lo mejor para tu mejor amigo! 🐾</h2>
            <p className="text-orange-50 text-sm font-medium">Encuentra la ropa y accesorios más tiernos y resistentes para tus mascotas.</p>
          </div>
          <Heart className="absolute -bottom-10 -right-10 w-64 h-64 text-white/10 rotate-12" />
          <PawPrint className="absolute top-4 right-10 w-24 h-24 text-white/5 -rotate-12" />
        </section>

        {/* Search and Filter Info */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="¿Qué estás buscando para tu mascota?"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl shadow-sm border-2 border-transparent focus:border-orange-400 outline-none transition-all text-gray-700 font-medium"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-gray-800">
              {selectedCategory === 'Todos' ? 'Nuestros Productos' : selectedCategory}
              <span className="ml-2 text-sm font-bold text-gray-400">({filteredProducts.length})</span>
            </h3>
            {selectedCategory !== 'Todos' && (
              <button 
                onClick={() => setSelectedCategory('Todos')}
                className="text-xs font-bold text-orange-500 hover:underline"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product: Product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={addToCart}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-4">
            <Search className="w-16 h-16 opacity-20" />
            <p className="text-lg font-medium">No encontramos productos que coincidan</p>
            <button
              onClick={() => { setSearchTerm(''); setSelectedCategory('Todos'); }}
              className="bg-orange-100 text-orange-600 px-6 py-2 rounded-xl font-bold"
            >
              Ver todo el catálogo
            </button>
          </div>
        )}
      </main>

      {/* Footer Info */}
      <footer className="bg-white border-t border-gray-100 mt-12 py-12 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          <div className="space-y-4">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <PawPrint className="w-6 h-6 text-orange-500" />
              <span className="text-xl font-bold text-orange-600 italic">Mimitos</span>
            </div>
            <p className="text-sm text-gray-500">Envios a Capital y Valle Viejo, o podes Retirar por el PCPC</p>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold text-gray-800">Contacto</h4>
            <p className="text-sm text-gray-500">WhatsApp: 3834465044</p>
            <p className="text-sm text-gray-500">Email: khabron@gmail.com</p>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold text-gray-800">Horarios</h4>
            <p className="text-sm text-gray-500">Horario Sabado de 9:00 a 13:00</p>
          </div>
        </div>
      </footer>

      <Cart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
        onClearCart={clearCart}
        onUpdateLocalStock={updateLocalStock}
        settings={settings}
      />

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-sm"
          >
            <div className="bg-orange-500 p-1 rounded-full">
              <Heart className="w-4 h-4 fill-current" />
            </div>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Shop />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
