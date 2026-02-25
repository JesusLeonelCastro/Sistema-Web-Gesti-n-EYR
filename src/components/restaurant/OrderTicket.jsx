import React from 'react';
import { formatInChileanTime } from '@/lib/utils';
import { UtensilsCrossed, Car } from 'lucide-react';

const OrderTicket = React.forwardRef(({ order }, ref) => {
  if (!order) return null;

  const total = order.items.reduce((acc, item) => acc + item.price_clp * item.quantity, 0);

  return (
    <div ref={ref} className="p-3 text-black bg-white" style={{ width: '80mm', fontFamily: "'Courier New', Courier, monospace", fontSize: '11px', lineHeight: '1.4' }}>
      <div className="text-center mb-3">
        <div className="flex items-center justify-center space-x-2 mb-1">
            <Car className="h-7 w-7" />
            <UtensilsCrossed className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-bold tracking-wider">RESTAURANTE SAN JOSÉ</h1>
      </div>

      <div className="my-3 border-t-2 border-b-2 border-dashed border-black py-2">
        <div className="flex justify-between">
            <span className="font-bold">PEDIDO:</span>
            <span className="font-bold">{order.order_code || 'N/A'}</span>
        </div>
        <div className="flex justify-between">
            <span>Fecha:</span>
            <span>{formatInChileanTime(order.created_at, 'dd/MM/yy HH:mm')}</span>
        </div>
        <div className="flex justify-between">
            <span>Cliente:</span>
            <span>{order.customer_name || '------------'}</span>
        </div>
         
      </div>
      
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b-2 border-dashed border-black">
            <th className="text-left py-1">CANT</th>
            <th className="text-left py-1">PRODUCTO</th>
            <th className="text-right py-1">SUBTOTAL</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, index) => (
            <tr key={index} className="align-top">
              <td className="py-1">{item.quantity}x</td>
              <td className="py-1">{item.name}</td>
              <td className="text-right py-1">${(item.price_clp * item.quantity).toLocaleString('es-CL')}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="my-3 border-t-2 border-dashed border-black pt-2">
        <div className="flex justify-between font-bold text-base">
          <span>TOTAL:</span>
          <span>${total.toLocaleString('es-CL')}</span>
        </div>
      </div>

      {order.description && (
        <div className="my-3 border-t border-dashed border-black pt-2 text-xs">
          <p className="font-bold uppercase">Notas Adicionales:</p>
          <p className="whitespace-pre-wrap">{order.description}</p>
        </div>
      )}

      <div className="text-center mt-4">
        <p className="font-bold">¡MUCHAS GRACIAS POR SU VISITA!</p>
      </div>
    </div>
  );
});

export default OrderTicket;