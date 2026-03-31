import React, { useState } from 'react';
import { ShoppingCart, X, Plus, Minus, Trash2, Send, PawPrint, MapPin, CreditCard, Truck, RefreshCw, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CartItem, AppSettings } from '../types';
import { recordSale, updateStock } from '../lib/googleSheets';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onUpdateLocalStock: (id: string, newStock: number) => void;
  settings: AppSettings;
}

export default function Cart({ isOpen, onClose, items, onUpdateQuantity, onRemoveItem, onClearCart, onUpdateLocalStock, settings }: CartProps) {
  const [customerName, setCustomerName] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Efectivo' | 'Transferencia'>('Efectivo');
  const [deliveryMethod, setDeliveryMethod] = useState<'Domicilio' | 'Retiro'>('Retiro');
  const [showCheckout, setShowCheckout] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState('');

  const getItemPrice = (item: CartItem) => {
    if (item.OFERTA && item.OFERTA > 0) {
      return item.PRECIO * (1 - item.OFERTA / 100);
    }
    return item.PRECIO;
  };

  const subtotal = items.reduce((sum, item) => sum + getItemPrice(item) * item.quantity, 0);
  const deliveryFee = deliveryMethod === 'Domicilio' ? settings.shippingPrice : 0;
  const total = subtotal + deliveryFee;

  const handleCheckout = async () => {
    if (!customerName.trim() || (deliveryMethod === 'Domicilio' && !address.trim())) {
      alert('Por favor, completa todos los campos requeridos.');
      return;
    }

    setIsSaving(true);

    try {
      const productList = items
        .map((item) => `${item.PRODUCTO} x${item.quantity}`)
        .join(', ');
      
      let phone = String(settings.whatsappNumber || '').replace(/\D/g, '');
      
      // Argentine number logic
      if (phone.length === 10) {
        phone = '549' + phone;
      } else if (phone.length === 12 && phone.startsWith('54')) {
        // If it has 54 but missing the 9 for mobile
        phone = '549' + phone.substring(2);
      }

      const detailedProductList = items
        .map((item) => {
          const price = getItemPrice(item);
          return `* ${item.PRODUCTO} x${item.quantity} - $${((price || 0) * (item.quantity || 1)).toLocaleString('es-AR')}`;
        })
        .join('\n');
      
      const message = `🐾 *¡Hola! Quisiera realizar un encargo de los siguientes productos:* 🐾\n\n${detailedProductList}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `💰 *Subtotal:* $${(subtotal || 0).toLocaleString('es-AR')}\n` +
        `🚚 *Entrega:* ${deliveryMethod === 'Domicilio' ? `$${(settings?.shippingPrice || 0).toLocaleString('es-AR')} (A domicilio)` : 'Gratis (Retiro)'}\n` +
        `✨ *TOTAL:* $${(total || 0).toLocaleString('es-AR')}\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `👤 *Nombre:* ${customerName}\n` +
        `📍 *Domicilio:* ${deliveryMethod === 'Domicilio' ? address : 'Retiro en local'}\n` +
        `💳 *Pago:* ${paymentMethod}\n\n` +
        `*En breve nos estaremos comunicando para terminar su encargo.*`;
      
      // Record sale in Google Sheets
      await recordSale({
        nombre: customerName,
        domicilio: deliveryMethod === 'Domicilio' ? address : 'Retiro en local',
        pedido: productList,
        total: total,
        fecha: new Date().toLocaleString('es-AR')
      });

      // Update stock for each item
      for (const item of items) {
        const newStock = Math.max(0, (item.STOCK || 0) - (item.quantity || 0));
        await updateStock(item.id, newStock);
        onUpdateLocalStock(item.id, newStock);
      }

      const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      setWhatsappUrl(url);
      setIsSuccess(true);
      onClearCart();
    } catch (error) {
      console.error('Error during checkout:', error);
      alert('Hubo un error al procesar tu pedido. Por favor, intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = () => {
    const message = decodeURIComponent(whatsappUrl.split('text=')[1]);
    navigator.clipboard.writeText(message);
    alert('Mensaje copiado al portapapeles. Puedes pegarlo en WhatsApp.');
  };

  const handleFinish = () => {
    setIsSuccess(false);
    setShowCheckout(false);
    setCustomerName('');
    setAddress('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white z-[110] shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-orange-50">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-6 h-6 text-orange-600" />
                <h2 className="text-xl font-bold text-gray-800">Tu Carrito</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors">
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-6 space-y-6">
              {isSuccess ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center h-full text-center gap-6"
                >
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-10 h-10 text-green-600" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-gray-800">¡Pedido Recibido!</h3>
                    <p className="text-gray-500 text-sm">Para completar tu encargo, haz clic en el botón de abajo para enviar el pedido por WhatsApp.</p>
                  </div>
                  <div className="w-full space-y-3">
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={handleFinish}
                      className="w-full bg-green-500 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-green-100 hover:bg-green-600 transition-all flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-5 h-5" />
                      Enviar por WhatsApp
                    </a>
                    <button
                      onClick={copyToClipboard}
                      className="w-full bg-gray-100 text-gray-600 py-3 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Copiar mensaje (si falla el botón)
                    </button>
                  </div>
                </motion.div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-4">
                  <PawPrint className="w-16 h-16 opacity-20" />
                  <p className="text-lg font-medium">Tu carrito está vacío</p>
                  <button
                    onClick={onClose}
                    className="text-orange-500 font-bold hover:underline"
                  >
                    Seguir comprando
                  </button>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="flex gap-4 items-center bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
                    <img
                      src={item.IMG || 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=400&q=80'}
                      alt={item.PRODUCTO}
                      className="w-20 h-20 object-cover rounded-xl shadow-sm"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-grow">
                      <h3 className="font-bold text-gray-800 text-sm line-clamp-1">{item.PRODUCTO}</h3>
                      <p className="text-xs text-gray-500 mb-2">Talle: {item.TALLE}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          {item.OFERTA && item.OFERTA > 0 ? (
                            <>
                              <span className="text-[10px] text-gray-400 line-through font-bold">
                                ${((item.PRECIO || 0) * (item.quantity || 1)).toLocaleString('es-AR')}
                              </span>
                              <span className="font-black text-red-600">
                                ${((getItemPrice(item) || 0) * (item.quantity || 1)).toLocaleString('es-AR')}
                              </span>
                            </>
                          ) : (
                            <span className="font-black text-orange-600">
                              ${((item.PRECIO || 0) * (item.quantity || 1)).toLocaleString('es-AR')}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                          <button
                            onClick={() => onUpdateQuantity(item.id, -1)}
                            className="p-1 hover:text-orange-500 transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                          <button
                            onClick={() => onUpdateQuantity(item.id, 1)}
                            className="p-1 hover:text-orange-500 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && !isSuccess && (
              <div className="p-6 bg-gray-50 border-t border-gray-200 space-y-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span className="text-gray-600">Total</span>
                  <span className="text-2xl text-orange-600">${(total || 0).toLocaleString('es-AR')}</span>
                </div>

                {!showCheckout ? (
                  <button
                    onClick={() => setShowCheckout(true)}
                    className="w-full bg-orange-500 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all flex items-center justify-center gap-2"
                  >
                    Continuar Compra
                  </button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    {/* Nombre */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 flex items-center gap-1">
                        Nombre Completo *
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Ej: María García"
                        className="w-full p-3 rounded-xl border-2 border-orange-50 focus:border-orange-500 outline-none transition-all text-sm"
                      />
                    </div>

                    {/* Entrega */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 flex items-center gap-1">
                        Método de Entrega
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setDeliveryMethod('Retiro')}
                          className={`p-3 rounded-xl border-2 text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                            deliveryMethod === 'Retiro' ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-100 text-gray-400'
                          }`}
                        >
                          <PawPrint className="w-4 h-4" />
                          Retiro Gratis
                        </button>
                        <button
                          onClick={() => setDeliveryMethod('Domicilio')}
                          className={`p-3 rounded-xl border-2 text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                            deliveryMethod === 'Domicilio' ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-100 text-gray-400'
                          }`}
                        >
                          <Truck className="w-4 h-4" />
                          Envío (${(settings?.shippingPrice || 0).toLocaleString('es-AR')})
                        </button>
                      </div>
                    </div>

                    {/* Domicilio (si aplica) */}
                    {deliveryMethod === 'Domicilio' && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> Dirección de Entrega *
                        </label>
                        <input
                          type="text"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Calle, Número, Barrio..."
                          className="w-full p-3 rounded-xl border-2 border-orange-50 focus:border-orange-500 outline-none transition-all text-sm"
                        />
                      </motion.div>
                    )}

                    {/* Pago */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 flex items-center gap-1">
                        Método de Pago
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setPaymentMethod('Efectivo')}
                          className={`p-3 rounded-xl border-2 text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                            paymentMethod === 'Efectivo' ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-100 text-gray-400'
                          }`}
                        >
                          <CreditCard className="w-4 h-4" />
                          Efectivo
                        </button>
                        <button
                          onClick={() => setPaymentMethod('Transferencia')}
                          className={`p-3 rounded-xl border-2 text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                            paymentMethod === 'Transferencia' ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-100 text-gray-400'
                          }`}
                        >
                          <CreditCard className="w-4 h-4" />
                          Transferencia
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => setShowCheckout(false)}
                        className="flex-1 bg-gray-100 text-gray-500 py-4 rounded-2xl font-bold text-sm"
                      >
                        Volver
                      </button>
                      <button
                        onClick={handleCheckout}
                        disabled={isSaving}
                        className="flex-[2] bg-green-500 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-green-100 hover:bg-green-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <MessageCircle className="w-5 h-5" />}
                        Confirmar Encargo
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
