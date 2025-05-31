import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ShoppingCart, Plus, Minus, Trash2, Printer } from 'lucide-react';

const CurrentOrderPanel = ({
  currentOrderItems,
  customerName,
  setCustomerName,
  orderNotes,
  setOrderNotes,
  addToOrder,
  removeFromOrder,
  deleteFromOrder,
  totalAmount,
  submitOrder,
  settings,
}) => {
  return (
    <Card className="lg:col-span-1 shadow-xl flex flex-col h-full">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center">
          <ShoppingCart className="w-7 h-7 mr-3 text-cyan-500" />
          Pedido Actual
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 flex-grow flex flex-col">
        <div className="flex-grow overflow-y-auto pr-2 -mr-2 max-h-[calc(100vh-450px)] min-h-[200px]">
          {currentOrderItems.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">El pedido está vacío.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs p-1">Ítem</TableHead>
                  <TableHead className="text-center text-xs p-1">Cant.</TableHead>
                  <TableHead className="text-right text-xs p-1">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentOrderItems.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium text-xs py-1 px-1">{item.name} <br/><span className="text-xs text-muted-foreground">{settings.currencySymbol} {item.price.toFixed(2)} c/u</span></TableCell>
                    <TableCell className="text-center py-1 px-1">
                      <div className="flex items-center justify-center">
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => removeFromOrder(item.id)}><Minus className="h-3 w-3"/></Button>
                        <span className="mx-1 text-xs">{item.quantity}</span>
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => addToOrder(item)}><Plus className="h-3 w-3"/></Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-1 px-1">
                      <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive hover:text-destructive/80" onClick={() => deleteFromOrder(item.id)}><Trash2 className="h-3 w-3"/></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
        <div className="border-t pt-3 mt-auto">
          <div>
            <Label htmlFor="customerName">Nombre del Cliente (Opcional)</Label>
            <Input id="customerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Ej: Mesa 5 / Juan Pérez" className="mt-1 h-8 text-sm"/>
          </div>
          <div className="mt-2">
            <Label htmlFor="orderNotes">Notas del Pedido (Opcional)</Label>
            <Textarea id="orderNotes" value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)} placeholder="Ej: Sin picante, extra queso..." className="mt-1 min-h-[40px] text-sm"/>
          </div>
          <div className="flex justify-between items-center mt-3 font-semibold text-md">
            <span>Total:</span>
            <span>{settings.currencySymbol} {totalAmount.toFixed(2)}</span>
          </div>
          <Button onClick={submitOrder} className="w-full mt-3 text-sm py-2.5" disabled={currentOrderItems.length === 0}>
            <Printer className="mr-2 h-4 w-4" /> Pagar y Generar Ticket
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CurrentOrderPanel;