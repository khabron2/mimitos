import React, { useState, useEffect } from 'react';
import { Product, AppSettings } from '../types';
import { fetchProducts, updateStock, login, saveProduct, deleteProduct, fetchSettings, updateSettings, uploadImage, fetchSales } from '../lib/googleSheets';
import { LayoutDashboard, Package, Save, RefreshCw, ArrowLeft, Search, Plus, Trash2, Settings, LogOut, Percent, X, Image as ImageIcon, Upload, Pencil, History, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function AdminPanel() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [settings, setSettings] = useState<AppSettings>({ shippingPrice: 3000, whatsappNumber: '3834465044' });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'inventory' | 'sales'>('inventory');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  
  // Modal states
  const [showProductModal, setShowProductModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product> | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      loadData();
    }
  }, [isLoggedIn]);

  const loadData = async () => {
    setLoading(true);
    const [productsData, settingsData, salesData] = await Promise.all([
      fetchProducts(),
      fetchSettings(),
      fetchSales()
    ]);
    setProducts(productsData);
    setSettings(settingsData);
    setSales(salesData);
    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const success = await login(user, pass);
    if (success) {
      setIsLoggedIn(true);
    } else {
      alert('Usuario o contraseña incorrectos');
    }
    setSaving(false);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct) return;
    setSaving(true);
    const success = await saveProduct(currentProduct, currentProduct.id);
    if (success) {
      await loadData();
      setShowProductModal(false);
      setCurrentProduct(null);
    } else {
      alert('Error al guardar el producto');
    }
    setSaving(false);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;
    setSaving(true);
    const success = await deleteProduct(id);
    if (success) {
      await loadData();
    } else {
      alert('Error al eliminar el producto');
    }
    setSaving(false);
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const success = await updateSettings(settings);
    if (success) {
      setShowSettingsModal(false);
    } else {
      alert('Error al guardar la configuración');
    }
    setSaving(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'IMG' | 'IMG2' | 'IMG3') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setSaving(true);
    const url = await uploadImage(file);
    if (url) {
      setCurrentProduct(prev => ({ ...prev!, [field]: url }));
    } else {
      alert('Error al subir la imagen');
    }
    setSaving(false);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md border border-orange-100"
        >
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="bg-orange-500 p-4 rounded-2xl shadow-lg shadow-orange-200">
              <LayoutDashboard className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-black text-gray-800">Acceso Administrativo</h1>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Usuario</label>
              <input 
                type="text" 
                value={user}
                onChange={(e) => setUser(e.target.value)}
                className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-orange-400 outline-none transition-all font-bold"
                placeholder="Ingresa tu usuario"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Contraseña</label>
              <input 
                type="password" 
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-orange-400 outline-none transition-all font-bold"
                placeholder="••••••••"
                required
              />
            </div>
            <button 
              type="submit"
              disabled={saving}
              className="w-full bg-orange-500 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Entrar al Panel'}
            </button>
            <Link to="/" className="block text-center text-sm font-bold text-gray-400 hover:text-orange-500 transition-colors">
              Volver a la tienda
            </Link>
          </form>
        </motion.div>
      </div>
    );
  }

  const filteredProducts = products.filter(p => 
    p.PRODUCTO.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.CATEGORIA.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const months = Array.from(new Set(sales.map(sale => {
    const dateParts = String(sale.Fecha || '').split(',')[0].split('/');
    if (dateParts.length === 3) {
      // Assuming DD/MM/YYYY or D/M/YYYY
      return `${dateParts[2]}-${dateParts[1].padStart(2, '0')}`;
    }
    return null;
  }).filter(Boolean))).sort().reverse() as string[];

  const filteredSales = sales.filter(sale => {
    if (selectedMonth === 'all') return true;
    const dateParts = String(sale.Fecha || '').split(',')[0].split('/');
    if (dateParts.length === 3) {
      const monthYear = `${dateParts[2]}-${dateParts[1].padStart(2, '0')}`;
      return monthYear === selectedMonth;
    }
    return false;
  });

  const monthNames: { [key: string]: string } = {
    '01': 'Enero', '02': 'Febrero', '03': 'Marzo', '04': 'Abril',
    '05': 'Mayo', '06': 'Junio', '07': 'Julio', '08': 'Agosto',
    '09': 'Septiembre', '10': 'Octubre', '11': 'Noviembre', '12': 'Diciembre'
  };

  const formatMonthLabel = (monthYear: string) => {
    const [year, month] = monthYear.split('-');
    return `${monthNames[month]} ${year}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/" className="p-2 bg-white rounded-full shadow-sm hover:bg-orange-50 transition-colors">
              <ArrowLeft className="w-6 h-6 text-orange-600" />
            </Link>
            <h1 className="text-3xl font-black text-gray-800 flex items-center gap-2">
              <LayoutDashboard className="w-8 h-8 text-orange-500" />
              Panel Admin
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowSettingsModal(true)}
              className="p-3 bg-white rounded-xl shadow-sm hover:bg-gray-50 text-gray-600 transition-all flex items-center gap-2 font-bold"
            >
              <Settings className="w-5 h-5" />
              Config
            </button>
            <button 
              onClick={() => { setCurrentProduct({}); setShowProductModal(true); }}
              className="p-3 bg-orange-500 rounded-xl shadow-lg shadow-orange-100 hover:bg-orange-600 text-white transition-all flex items-center gap-2 font-bold px-4"
            >
              <Plus className="w-5 h-5" />
              Nuevo
            </button>
            <button 
              onClick={() => setIsLoggedIn(false)}
              className="p-3 bg-white rounded-xl shadow-sm hover:bg-red-50 text-red-500 transition-all"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-4 bg-orange-100 rounded-2xl">
              <Package className="w-8 h-8 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Productos</p>
              <p className="text-3xl font-black text-gray-800">{products.length}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-4 bg-green-100 rounded-2xl">
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Ventas</p>
              <p className="text-3xl font-black text-gray-800">{sales.length}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-6 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
              activeTab === 'inventory' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Package className="w-4 h-4" />
            Inventario
          </button>
          <button
            onClick={() => setActiveTab('sales')}
            className={`px-6 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
              activeTab === 'sales' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <History className="w-4 h-4" />
            Ventas
          </button>
        </div>

        {activeTab === 'inventory' ? (
          /* Inventory Table */
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-gray-800">Inventario</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-gray-50 rounded-xl border border-gray-200 focus:border-orange-500 outline-none w-full md:w-80 transition-all font-medium"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-400 text-xs font-bold uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Producto</th>
                    <th className="px-6 py-4">Precio</th>
                    <th className="px-6 py-4">Acciones</th>
                    <th className="px-6 py-4">Stock</th>
                    <th className="px-6 py-4">Oferta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center">
                        <RefreshCw className="w-10 h-10 text-orange-500 animate-spin mx-auto" />
                      </td>
                    </tr>
                  ) : filteredProducts.map((product) => (
                    <tr 
                      key={product.id} 
                      className={cn(
                        "transition-colors",
                        product.STOCK === 0 ? "bg-red-100 hover:bg-red-200/60" : "hover:bg-orange-50/30"
                      )}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={product.IMG || 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=400&q=80'} 
                            alt="" 
                            className="w-10 h-10 rounded-lg object-cover shadow-sm"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <p className="font-bold text-gray-700">{product.PRODUCTO}</p>
                            <p className="text-[10px] text-gray-400 uppercase font-bold">{product.CATEGORIA} • {product.TALLE}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-black text-gray-800">
                        ${(product.PRECIO || 0).toLocaleString('es-AR')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setCurrentProduct(product); setShowProductModal(true); }}
                            className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg transition-all"
                          >
                            <Pencil className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-black ${product.STOCK <= 3 ? 'text-red-500' : 'text-gray-700'}`}>
                          {product.STOCK}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {product.OFERTA ? (
                          <span className="bg-red-100 text-red-600 px-2 py-1 rounded-lg text-xs font-black">
                            -{product.OFERTA}%
                          </span>
                        ) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Sales Table */
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Registro de Ventas</h2>
                {selectedMonth !== 'all' && (
                  <p className="text-sm font-bold text-green-600">
                    Total del mes: ${filteredSales.reduce((sum, s) => sum + (parseFloat(s.Total) || 0), 0).toLocaleString('es-AR')}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-gray-400 uppercase">Filtrar por mes:</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="p-2 bg-gray-50 rounded-xl border border-gray-200 focus:border-green-500 outline-none font-bold text-sm"
                >
                  <option value="all">Todos los meses</option>
                  {months.map(m => (
                    <option key={m} value={m}>{formatMonthLabel(m)}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-400 text-xs font-bold uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Fecha</th>
                    <th className="px-6 py-4">Cliente</th>
                    <th className="px-6 py-4">Pedido</th>
                    <th className="px-6 py-4">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-20 text-center">
                        <RefreshCw className="w-10 h-10 text-green-500 animate-spin mx-auto" />
                      </td>
                    </tr>
                  ) : filteredSales.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-20 text-center text-gray-400 font-bold">
                        No hay ventas registradas para este periodo
                      </td>
                    </tr>
                  ) : filteredSales.slice().reverse().map((sale, i) => (
                    <tr key={i} className="hover:bg-green-50/30 transition-colors">
                      <td className="px-6 py-4 text-xs font-bold text-gray-500">{sale.Fecha}</td>
                      <td className="px-6 py-4 font-bold text-gray-700">
                        {sale.Nombre}
                        <p className="text-[10px] text-gray-400 font-medium">{sale.Domicilio}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{sale.Pedido}</td>
                      <td className="px-6 py-4 font-black text-green-600">
                        ${(parseFloat(sale.Total) || 0).toLocaleString('es-AR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Product Modal */}
      <AnimatePresence>
        {showProductModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowProductModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-orange-50">
                <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
                  <Package className="w-6 h-6 text-orange-500" />
                  {currentProduct?.id ? 'Editar Producto' : 'Nuevo Producto'}
                </h2>
                <button onClick={() => setShowProductModal(false)} className="p-2 hover:bg-white rounded-full transition-colors">
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>
              <form onSubmit={handleSaveProduct} className="p-6 overflow-y-auto space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Nombre del Producto</label>
                      <input 
                        type="text" required
                        value={currentProduct?.PRODUCTO || ''}
                        onChange={(e) => setCurrentProduct({...currentProduct!, PRODUCTO: e.target.value})}
                        className="w-full p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-orange-400 outline-none font-bold"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Categoría</label>
                        <select 
                          value={currentProduct?.CATEGORIA || ''}
                          onChange={(e) => setCurrentProduct({...currentProduct!, CATEGORIA: e.target.value})}
                          className="w-full p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-orange-400 outline-none font-bold"
                        >
                          <option value="Chalecos">Chalecos</option>
                          <option value="Correas">Correas</option>
                          <option value="Juguetes">Juguetes</option>
                          <option value="Accesorios">Accesorios</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Talle</label>
                        <input 
                          type="text"
                          value={currentProduct?.TALLE || ''}
                          onChange={(e) => setCurrentProduct({...currentProduct!, TALLE: e.target.value})}
                          className="w-full p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-orange-400 outline-none font-bold"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Precio ($)</label>
                        <input 
                          type="number" required
                          value={currentProduct?.PRECIO || ''}
                          onChange={(e) => setCurrentProduct({...currentProduct!, PRECIO: parseFloat(e.target.value)})}
                          className="w-full p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-orange-400 outline-none font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Stock</label>
                        <input 
                          type="number" required
                          value={currentProduct?.STOCK || ''}
                          onChange={(e) => setCurrentProduct({...currentProduct!, STOCK: parseInt(e.target.value)})}
                          className="w-full p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-orange-400 outline-none font-bold"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1 flex items-center gap-1">
                        <Percent className="w-3 h-3" /> Oferta (%)
                      </label>
                      <select 
                        value={currentProduct?.OFERTA || 0}
                        onChange={(e) => setCurrentProduct({...currentProduct!, OFERTA: parseInt(e.target.value)})}
                        className="w-full p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-orange-400 outline-none font-bold"
                      >
                        <option value={0}>Sin oferta</option>
                        <option value={10}>10% OFF</option>
                        <option value={20}>20% OFF</option>
                        <option value={30}>30% OFF</option>
                        <option value={40}>40% OFF</option>
                        <option value={50}>50% OFF</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1 flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" /> Imagen Principal
                      </label>
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          value={currentProduct?.IMG || ''}
                          onChange={(e) => setCurrentProduct({...currentProduct!, IMG: e.target.value})}
                          className="flex-grow p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-orange-400 outline-none font-bold text-xs"
                          placeholder="Link de la imagen"
                        />
                        <label className="bg-orange-100 text-orange-600 p-3 rounded-xl cursor-pointer hover:bg-orange-200 transition-colors">
                          <Upload className="w-5 h-5" />
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'IMG')} />
                        </label>
                      </div>
                      {currentProduct?.IMG && (
                        <img src={currentProduct.IMG} alt="Preview" className="mt-2 w-full h-32 object-cover rounded-xl border border-gray-100" />
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1 flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" /> Imagen 2 (Opcional)
                      </label>
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          value={currentProduct?.IMG2 || ''}
                          onChange={(e) => setCurrentProduct({...currentProduct!, IMG2: e.target.value})}
                          className="flex-grow p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-orange-400 outline-none font-bold text-xs"
                          placeholder="Link de la imagen 2"
                        />
                        <label className="bg-orange-100 text-orange-600 p-3 rounded-xl cursor-pointer hover:bg-orange-200 transition-colors">
                          <Upload className="w-5 h-5" />
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'IMG2')} />
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Características</label>
                      <textarea 
                        rows={4}
                        value={currentProduct?.CARACTERISTICAS || ''}
                        onChange={(e) => setCurrentProduct({...currentProduct!, CARACTERISTICAS: e.target.value})}
                        className="w-full p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-orange-400 outline-none font-bold text-sm"
                      />
                    </div>
                  </div>
                </div>
                <div className="pt-4">
                  <button 
                    type="submit"
                    disabled={saving}
                    className="w-full bg-orange-500 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettingsModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowSettingsModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
                  <Settings className="w-6 h-6 text-gray-500" />
                  Configuración
                </h2>
                <button onClick={() => setShowSettingsModal(false)} className="p-2 hover:bg-white rounded-full transition-colors">
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>
              <form onSubmit={handleUpdateSettings} className="p-6 space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Precio de Envío ($)</label>
                  <input 
                    type="number" required
                    value={settings.shippingPrice}
                    onChange={(e) => setSettings({...settings, shippingPrice: parseFloat(e.target.value)})}
                    className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-orange-400 outline-none font-bold text-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">WhatsApp de Ventas</label>
                  <input 
                    type="text" required
                    value={settings.whatsappNumber}
                    onChange={(e) => setSettings({...settings, whatsappNumber: e.target.value})}
                    className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-orange-400 outline-none font-bold"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={saving}
                  className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Guardar Configuración
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
