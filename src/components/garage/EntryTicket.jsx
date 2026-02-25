import React, { forwardRef } from 'react';
import { formatInChileanTime } from '@/lib/utils';
import { Car } from 'lucide-react';

const TicketRow = ({ label, value, valueClass = '' }) => (
  <div className="flex justify-between">
    <span className="font-sans">{label}</span>
    <span className={`font-mono ${valueClass}`}>{value}</span>
  </div>
);

const EntryTicket = forwardRef(({ ticketData }, ref) => {
  if (!ticketData) return null;

  return (
    <div ref={ref} className="bg-white text-black p-2" style={{ width: '80mm', boxSizing: 'border-box' }}>
      <div className="text-center mb-2">
        <h1 className="text-xl font-bold font-sans">Garaje San José</h1>
        <p className="text-xs font-sans">TICKET DE INGRESO</p>
      </div>
      
      <div className="border-t border-b border-dashed border-black py-2 my-2 text-xs space-y-1">
        <TicketRow label="Pedido:" value={ticketData.stayId} />
        <TicketRow label="Fecha:" value={formatInChileanTime(ticketData.entry_at, 'dd/MM/yyyy, HH:mm')} />
        <TicketRow label="Tipo:" value="Estacionamiento" />
      </div>

      <div className="my-2">
        <h2 className="font-bold font-sans text-sm text-center">VEHÍCULO</h2>
        <div className="border-t border-dashed border-black mt-1 mb-2"></div>
        <div className="text-xs space-y-1">
            <TicketRow label="MATRÍCULA:" value={ticketData.license_plate} valueClass="font-bold text-sm" />
            <TicketRow label="TIPO VEHÍCULO:" value={ticketData.vehicle_type} />
            <TicketRow label="PAÍS:" value={ticketData.country} />
            {ticketData.driver_name && <TicketRow label="CONDUCTOR:" value={ticketData.driver_name} />}
        </div>
      </div>
      
      <div className="border-t border-dashed border-black pt-2 mt-3 text-center text-xs font-sans">
        <p>Conserve este ticket. Es indispensable para el retiro del vehículo.</p>
        <p className="font-bold mt-1">¡Gracias por su preferencia!</p>
      </div>
    </div>
  );
});

EntryTicket.displayName = 'EntryTicket';
export default EntryTicket;